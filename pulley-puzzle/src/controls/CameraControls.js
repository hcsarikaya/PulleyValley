// CameraControls.js
import * as THREE from 'three';
import SoundManager from "../game/SoundManager.js";

export class CameraControls {
    constructor(camera, renderer, options = {}, roomSize = [80, 50, 45], roomCenter = [0, 0, 0]) {
        this.camera = camera;
        this.renderer = renderer;
        this.soundManager = new SoundManager(this.camera); // Pass the camera to SoundManager

        // -------------------------------------------
        // LOAD AND START SOUNDS
        // -------------------------------------------
        this.soundManager.loadSounds();
        this.soundManager.playMusic();

        // -------------------------------------------
        // MOVEMENT SETTINGS
        // -------------------------------------------
        this.moveSpeed        = options.moveSpeed        || 20;
        this.runMultiplier    = options.runMultiplier    || 2;    // Speed multiplier when running/flying faster
        this.dashSpeed        = options.dashSpeed        || 80;   // Speed during dash
        this.dashDuration     = options.dashDuration     || 0.2;
        this.dashCooldown     = options.dashCooldown     || 0.1;
        this.jumpSpeed        = options.jumpSpeed        || 20;
        this.gravity          = options.gravity          || 20;
        this.mouseSensitivity = options.mouseSensitivity || 0.002;
        this.eyeHeight        = options.eyeHeight        || 7;

        // Path movement speeds (for rotating & moving along the special route)
        this.pathMovementSpeed = options.pathMovementSpeed || 80;
        this.pathRotationSpeed = options.pathRotationSpeed || 5;

        // -------------------------------------------
        // CAMERA STATE
        // -------------------------------------------
        this.isJumping        = false;
        this.verticalVelocity = 0;
        this.pitch            = 0; // Rotation around X axis
        this.yaw              = 0; // Rotation around Y axis

        // -------------------------------------------
        // DASH STATE
        // -------------------------------------------
        this.isDashing         = false;
        this.dashTimeRemaining = 0;
        this.lastDashTime      = -Infinity;

        // -------------------------------------------
        // FREE-FLY MODE
        // -------------------------------------------
        this.isFreeFly = false; // Toggled by pressing F

        // -------------------------------------------
        // PATH MOVEMENT
        // -------------------------------------------
        this.pathActive = false;     // Are we currently doing the scripted path?
        this.pathIndex  = 0;         // Current step in the path
        this.pathSteps  = [];        // Array of steps (rotate or move)
        this.isAtFinal  = false;     // True if we've completed the forward route
        this.disableMovement = false;// If true, user cannot move (but can still rotate)

        // We'll store the initial camera pos/orientation when P is first pressed:
        this.initialPosition = new THREE.Vector3();
        this.initialPitch    = 0;
        this.initialYaw      = 0;

        // -------------------------------------------
        // KEYBOARD KEYS
        // -------------------------------------------
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false,
            shift: false,
            ctrl: false,
            p: false
        };

        // -------------------------------------------
        // INITIAL CAMERA POSITION
        // -------------------------------------------
        this.camera.position.set(0, this.eyeHeight, 5);

        // -------------------------------------------
        // POINTER LOCK
        // -------------------------------------------
        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });

        // -------------------------------------------
        // EVENT LISTENERS
        // -------------------------------------------
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup',   (e) => this.onKeyUp(e));
        document.addEventListener('mousemove',(e) => this.onMouseMove(e));

        // -------------------------------------------
        // ROOM / DOOR PARAMETERS
        // -------------------------------------------
        // Note that the second element in roomSize is "height" but used as y,
        // so we reorder it in [width, height, depth] format
        this.roomSize    = [roomSize[0], roomSize[2], roomSize[1]];
        this.roomCenter  = roomCenter;   // [cx, cy, cz]

        // Current room index, but now we consider rooms extending in negative Z
        this.currentRoom = 0;
        this.levelPassed = 0;
        this.isWon = false;

        // Door region (for crossing between rooms)
        this.doorXMin = -5;
        this.doorXMax =  5;
        this.doorYMin =  0;
        this.doorYMax = 15;
    }

    // ----------------------------------------------------------------
    // KEY DOWN
    // ----------------------------------------------------------------
    onKeyDown(event) {
        const key = event.key.toLowerCase();

        // Handle P key for path movement
        if (key === 'p') {
            this.startPathMovement();
            return;
        }

        switch (key) {
            case 'w':
            case 'a':
            case 's':
            case 'd':
                this.keys[key] = true;

                // If not free-fly, handle walking/running sounds
                if (!this.isFreeFly && !this.disableMovement) {
                    if (!this.keys.shift) {
                        // Play walk if not already walking
                        this.soundManager.playLoop('walk');
                    }
                }
                break;

            case 'shift':
                this.keys.shift = true;

                // If not free-fly and not disabled, handle running sounds
                if (!this.isFreeFly && !this.disableMovement) {
                    // Stop walk sound
                    this.soundManager.stopLoop('walk');
                    // Start run sound
                    this.soundManager.playLoop('run');
                }
                break;

            case 'ctrl':
            case 'control':
                this.keys.ctrl = true;

                // Only initiate dash if not free-fly and not disabled
                if (!this.isFreeFly && !this.disableMovement) {
                    this.initiateDash();
                }
                break;

            case ' ':
                this.keys.space = true;
                // Jump (only in normal mode and not disabled)
                if (!this.isFreeFly && !this.disableMovement) {
                    // Jump only if not already in the air
                    if (!this.isJumping) {
                        this.isJumping = true;
                        this.verticalVelocity = this.jumpSpeed;
                        this.soundManager.playSound('jump');
                    }
                }
                break;

            case 'f':
                // Toggle free-fly
                this.isFreeFly = !this.isFreeFly;

                // Stop any movement sounds if switching into free-fly
                if (this.isFreeFly) {
                    this.soundManager.stopLoop('walk');
                    this.soundManager.stopLoop('run');
                    // Also cancel dash if mid-dash
                    this.isDashing = false;
                } else {
                    // If toggling back to normal mode, ensure correct sounds if moving
                    if ((this.keys.w || this.keys.a || this.keys.s || this.keys.d) && !this.disableMovement) {
                        if (this.keys.shift) {
                            this.soundManager.playLoop('run');
                        } else {
                            this.soundManager.playLoop('walk');
                        }
                    }
                }
                break;

            default:
                break;
        }
    }

    // ----------------------------------------------------------------
    // KEY UP
    // ----------------------------------------------------------------
    onKeyUp(event) {
        const key = event.key.toLowerCase();
        switch (key) {
            case 'w':
            case 'a':
            case 's':
            case 'd':
                this.keys[key] = false;
                // In normal mode, check if we need to stop walking sound
                if (!this.isFreeFly && !this.disableMovement) {
                    this.checkStopWalking();
                }
                break;

            case 'shift':
                this.keys.shift = false;
                // In normal mode, stop run sound; possibly resume walk
                if (!this.isFreeFly && !this.disableMovement) {
                    this.soundManager.stopLoop('run');
                    if (this.keys.w || this.keys.a || this.keys.s || this.keys.d) {
                        this.soundManager.playLoop('walk');
                    }
                }
                break;

            case 'ctrl':
            case 'control':
                this.keys.ctrl = false;
                break;

            case ' ':
                this.keys.space = false;
                break;

            default:
                break;
        }
    }

    // ----------------------------------------------------------------
    // CHECK IF WE SHOULD STOP WALKING SOUND
    // ----------------------------------------------------------------
    checkStopWalking() {
        const isMoving = this.keys.w || this.keys.a || this.keys.s || this.keys.d;
        if (!isMoving) {
            this.soundManager.stopLoop('walk');
        }
    }

    // ----------------------------------------------------------------
    // MOUSE MOVE
    // ----------------------------------------------------------------
    onMouseMove(event) {
        // Mouse rotation is always allowed (even if disableMovement is true)
        // Only rotate if pointer is locked on the renderer
        if (document.pointerLockElement !== this.renderer.domElement) return;

        // Yaw (left/right) and Pitch (up/down)
        this.yaw   -= event.movementX * this.mouseSensitivity;
        this.pitch -= event.movementY * this.mouseSensitivity;

        // Clamp pitch so you can't flip the camera fully
        const maxPitch = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

        // Update the camera rotation using Euler angles
        this.updateCameraRotation();
    }

    // ----------------------------------------------------------------
    // INITIATE DASH
    // ----------------------------------------------------------------
    initiateDash() {
        // If already in free-fly, no dash
        if (this.isFreeFly) return;

        const currentTime = performance.now() / 1000; // seconds
        if (currentTime - this.lastDashTime < this.dashCooldown) {
            // Cooldown not yet passed
            return;
        }

        this.isDashing = true;
        this.dashTimeRemaining = this.dashDuration;
        this.lastDashTime = currentTime;

        // Play dash sound
        this.soundManager.playSound('dash');
    }

    // ----------------------------------------------------------------
    // START THE PATH MOVEMENT (CALLED WHEN PRESSING 'P')
    // ----------------------------------------------------------------
    startPathMovement() {
        // If we're already in the middle of a path, do nothing
        if (this.pathActive) return;

        // Toggle between going forward vs. going back
        // If we are NOT at final yet, do the forward route
        // If we ARE at final, do the backward route
        this.pathIndex = 0;
        this.pathActive = true;
        this.disableMovement = true; // disable WASD/dash/jump while path is active

        if (!this.isAtFinal) {
            // Save the current position/orientation as "initial"
            this.initialPosition.copy(this.camera.position);
            this.initialPitch = this.pitch;
            this.initialYaw   = this.yaw;

            const y = this.camera.position.y;
            const z = this.camera.position.z;

            // Forward steps:
            // 1) rotate to [0, y, z]
            // 2) move   to [0, y, z]
            // 3) rotate to [0, y, 50]
            // 4) move   to [0, y, 50]
            // 5) rotate to [0, 0, 50]
            // 6) move   to [0, 20, 50]
            this.pathSteps = [
                { type: 'rotate', position: new THREE.Vector3(0, y, z) },
                { type: 'move',   position: new THREE.Vector3(0, y, z) },
                { type: 'rotate', position: new THREE.Vector3(0, y, 50) },
                { type: 'move',   position: new THREE.Vector3(0, y, 50) },
                { type: 'rotate', position: new THREE.Vector3(0, 0, 50) },
                { type: 'move',   position: new THREE.Vector3(0, 40, 50) },
            ];

        } else {
            // We are at the final location => go back to the initial location
            // by reversing the route
            const initY = this.initialPosition.y;
            const initZ = this.initialPosition.z;

            // Backward route (reverse):
            // 1) rotate to [0, 0, 50]
            // 2) move   to [0, 0, 50]
            // 3) rotate to [0, initY, 50]
            // 4) move   to [0, initY, 50]
            // 5) rotate to [0, initY, initZ]
            // 6) move   to [0, initY, initZ]
            // 7) rotate to initialPosition
            // 8) move   to initialPosition
            this.pathSteps = [
                { type: 'rotate', position: new THREE.Vector3(0, 0, 50) },
                { type: 'move',   position: new THREE.Vector3(0, 0, 50) },
                { type: 'rotate', position: new THREE.Vector3(0, initY, 50) },
                { type: 'move',   position: new THREE.Vector3(0, initY, 50) },
                { type: 'rotate', position: new THREE.Vector3(0, initY, initZ) },
                { type: 'move',   position: new THREE.Vector3(0, initY, initZ) },
                // Final rotation & move to restore original location
                { type: 'rotate', position: this.initialPosition.clone() },
                { type: 'move',   position: this.initialPosition.clone() },
            ];
        }
    }

    // ----------------------------------------------------------------
    // UPDATE PATH MOVEMENT
    // ----------------------------------------------------------------
    updatePathMovement(deltaTime) {
        if (!this.pathActive) return;
        if (this.pathIndex >= this.pathSteps.length) {
            // Finished all steps
            this.pathActive = false;

            // If we just did the forward route, we're now "at final"
            // => remain locked in place, but can still rotate
            if (!this.isAtFinal) {
                this.isAtFinal = true;
                // remain disableMovement = true

                // ──────────────────────────────────────────────────
                //  TILT THE CAMERA DOWN TO LOOK AT THE GROUND
                // ──────────────────────────────────────────────────
                this.pitch = -Math.PI / 2.5;  // ~ -72 degrees downward
                this.yaw = 0;                 // Reset yaw to look straight ahead
                this.updateCameraRotation();
            }
            // If we just did the backward route, we can move again
            else {
                this.isAtFinal = false;
                this.disableMovement = false;
            }
            return;
        }

        const step = this.pathSteps[this.pathIndex];

        if (step.type === 'rotate') {
            // Rotate until facing step.position
            const done = this.rotateToPosition(step.position, deltaTime);
            if (done) {
                this.pathIndex++;
            }
        }
        else if (step.type === 'move') {
            // Move until we reach step.position
            const done = this.moveToPosition(step.position, deltaTime);
            if (done) {
                this.pathIndex++;
            }
        }
    }

    // ----------------------------------------------------------------
    // Rotate (yaw only) until facing the target position
    // Returns true when rotation is complete
    // ----------------------------------------------------------------
    rotateToPosition(targetPos, deltaTime) {
        // Direction on the horizontal plane
        const direction = new THREE.Vector3().subVectors(targetPos, this.camera.position);
        direction.y = 0; // ignore vertical for yaw
        const distSq = direction.lengthSq();

        // If the target is basically the same spot, call it done
        if (distSq < 1e-6) return true;

        direction.normalize();

        // Because the camera's forward is -Z in default orientation, we negate
        // the X and Z components so that yaw=0 means "looking forward"
        const targetYaw = Math.atan2(-direction.x, -direction.z);

        // Current difference in yaw
        let yawDiff = targetYaw - this.yaw;
        // Normalize yawDiff to [-π, π]
        yawDiff = ((yawDiff + Math.PI) % (2 * Math.PI)) - Math.PI;

        // Determine how much we can rotate this frame
        const rotateStep = this.pathRotationSpeed * deltaTime;

        if (Math.abs(yawDiff) < rotateStep) {
            // Close enough — snap to target
            this.yaw = targetYaw;
            this.updateCameraRotation();
            return true;
        }

        // Rotate in correct direction
        this.yaw += Math.sign(yawDiff) * rotateStep;
        this.updateCameraRotation();
        return false;
    }

    // ----------------------------------------------------------------
    // Move in a straight line towards the target position
    // Returns true when movement is complete
    // ----------------------------------------------------------------
    moveToPosition(targetPos, deltaTime) {
        const distance = this.camera.position.distanceTo(targetPos);
        const step = this.pathMovementSpeed * deltaTime;

        if (distance < step) {
            // Close enough — snap
            this.camera.position.copy(targetPos);
            return true;
        }

        const direction = new THREE.Vector3()
            .subVectors(targetPos, this.camera.position)
            .normalize();
        this.camera.position.add(direction.multiplyScalar(step));
        return false;
    }

    // ----------------------------------------------------------------
    // UPDATE CAMERA ROTATION
    // ----------------------------------------------------------------
    updateCameraRotation() {
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);
    }

    // ----------------------------------------------------------------
    // MAIN UPDATE LOOP (CALL THIS EVERY FRAME)
    // ----------------------------------------------------------------
    update(deltaTime) {
        // 1) If we're in a path animation, do that first
        if (this.pathActive) {
            this.updatePathMovement(deltaTime);
            return;
        }

        // 2) Even if disableMovement = true, we still allow rotation in onMouseMove
        //    But we skip WASD, dash, jump, etc., if movement is disabled.
        if (this.disableMovement) {
            return; // skip normal movement
        }

        // 3) Calculate direction vectors from camera orientation
        const forward = new THREE.Vector3(0, 0, -1)
            .applyQuaternion(this.camera.quaternion)
            .normalize();
        const right = new THREE.Vector3(1, 0, 0)
            .applyQuaternion(this.camera.quaternion)
            .normalize();

        // 4) FREE-FLY MODE
        if (this.isFreeFly) {
            let speed = this.moveSpeed;
            if (this.keys.shift) {
                speed *= this.runMultiplier;
            }
            const velocity = speed * deltaTime;

            // Move horizontally
            if (this.keys.w) this.camera.position.addScaledVector(forward,  velocity);
            if (this.keys.s) this.camera.position.addScaledVector(forward, -velocity);
            if (this.keys.a) this.camera.position.addScaledVector(right,   -velocity);
            if (this.keys.d) this.camera.position.addScaledVector(right,    velocity);

            // Move vertically (SPACE = up, CTRL = down)
            if (this.keys.space) {
                this.camera.position.y += velocity;
            }
            if (this.keys.ctrl) {
                this.camera.position.y -= velocity;
            }
            // No return; we still apply room constraints below

            // 5) NORMAL MODE
        } else {
            // Flatten forward/right so we don't move vertically
            forward.y = 0;
            right.y   = 0;
            forward.normalize();
            right.normalize();

            // Determine current speed
            let speed = this.moveSpeed;
            if (this.keys.shift && !this.isDashing) {
                speed *= this.runMultiplier;
            }
            const velocity = speed * deltaTime;

            // Move camera based on keys
            if (this.keys.w) this.camera.position.addScaledVector(forward,  velocity);
            if (this.keys.s) this.camera.position.addScaledVector(forward, -velocity);
            if (this.keys.a) this.camera.position.addScaledVector(right,   -velocity);
            if (this.keys.d) this.camera.position.addScaledVector(right,    velocity);

            // Handle dashing
            if (this.isDashing) {
                const dashVelocity = this.dashSpeed * deltaTime;
                this.camera.position.addScaledVector(forward, dashVelocity);
                this.dashTimeRemaining -= deltaTime;
                if (this.dashTimeRemaining <= 0) {
                    this.isDashing = false;
                }
            }

            // Jumping and gravity
            if (this.isJumping) {
                // Stop footstep sounds in mid-air
                this.soundManager.stopLoop('walk');
                this.soundManager.stopLoop('run');

                // Apply vertical velocity
                this.camera.position.y += this.verticalVelocity * deltaTime;
                // Apply gravity
                this.verticalVelocity -= this.gravity * deltaTime;

                // Check if landed
                if (this.camera.position.y <= this.eyeHeight) {
                    this.camera.position.y = this.eyeHeight;
                    this.isJumping = false;
                    this.verticalVelocity = 0;

                    // Resume walking or running sounds if still moving
                    if (this.keys.w || this.keys.a || this.keys.s || this.keys.d) {
                        if (this.keys.shift) {
                            this.soundManager.playLoop('run');
                        } else {
                            this.soundManager.playLoop('walk');
                        }
                    }
                }
            } else {
                // Keep camera at fixed eye height if not jumping
                this.camera.position.y = this.eyeHeight;
            }
        }

        // ------------------------------------------------------------
        // 6) CONSTRAIN CAMERA TO THE CURRENT ROOM
        // ------------------------------------------------------------
        const camPos = this.camera.position;

        // Unpack room parameters
        const [roomWidth, roomHeight, roomDepth] = this.roomSize;
        const [centerX, centerY, centerZ]        = this.roomCenter;

        // Compute half-sizes
        const halfWidth = roomWidth / 2;
        const halfDepth = roomDepth / 2;

        // zMin, zMax for the current room
        const zMin = centerZ - (this.currentRoom * roomDepth) - halfDepth + 2;
        const zMax = centerZ - (this.currentRoom * roomDepth) + halfDepth - 2;

        // X boundaries
        const xMin = centerX - halfWidth + 2;
        const xMax = centerX + halfWidth - 2;

        // Y boundaries (floor/ceiling)
        const yMin = 2;
        const yMax = centerY + roomHeight - 2;

        // Clamp X
        if (camPos.x < xMin) camPos.x = xMin;
        if (camPos.x > xMax) camPos.x = xMax;

        // Optionally clamp Y to the room's ceiling/floor
        if (camPos.y < yMin) camPos.y = yMin;
        if (camPos.y > yMax) camPos.y = yMax;

        // Room transitions in negative Z direction:
        // Going "forward" => z decreases
        if (camPos.z < zMin) {
            // Check door region
            if (
                camPos.x >= this.doorXMin && camPos.x <= this.doorXMax &&
                camPos.y >= this.doorYMin && camPos.y <= this.doorYMax
            ) {
                this.currentRoom++;
            } else {
                camPos.z = zMin;
            }
        }
        // Going "backward" => z increases
        if (camPos.z > zMax) {
            // Check door region
            if (
                camPos.x >= this.doorXMin && camPos.x <= this.doorXMax &&
                camPos.y >= this.doorYMin && camPos.y <= this.doorYMax
            ) {
                this.currentRoom--;
            } else {
                camPos.z = zMax;
            }
        }

        // Example: if passing a certain threshold => next level
        if (
            this.camera.position.z < -1 * this.levelPassed * roomDepth - 30 &&
            this.currentRoom === this.levelPassed + 1
        ) {
            this.soundManager.playSound("nextLevel");
            this.levelPassed += 1;
        }

        if (this.levelPassed === 4 && !this.isWon) {
            this.isWon = true;
            const winMessage = document.createElement('div');
            winMessage.textContent = 'YOU WON';

            Object.assign(winMessage.style, {
                position: 'fixed',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                padding: '20px',
                backgroundColor: 'rgba(0, 128, 0, 0)',
                color: '#fff',
                fontSize: '8em',
                borderRadius: '10px',
                textAlign: 'center',
                zIndex: '1000',
                opacity: '1',
                transition: 'all 1s ease', // Changed to 'all' for better browser support
                pointerEvents: 'none',
            });

            // Force a reflow before adding the element
            document.body.appendChild(winMessage);
            winMessage.offsetHeight; // Force a reflow

            setTimeout(() => {
                winMessage.style.opacity = '0';
                console.log('Fading started'); // Debug log
            }, 3000);

            winMessage.addEventListener('transitionend', (e) => {
                console.log('Transition ended:', e.propertyName); // Debug log
                winMessage.remove();
            });
        }



    }
}
