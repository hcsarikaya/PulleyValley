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
        // PATH MOVEMENT STATE
        // -------------------------------------------
        this.isInPathMovement   = false;
        this.pathStage          = 0; // Index into pathSteps
        this.pathSteps          = []; // Array of steps to execute
        this.isPathForward      = true; // Determines direction of path
        this.originalPosition   = null; // To store original position
        this.originalRotation   = null; // To store original rotation

        this.pathMovementSpeed  = options.pathMovementSpeed || 80;
        this.pathRotationSpeed  = options.pathRotationSpeed || 5;

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
        this.roomSize    = [roomSize[0], roomSize[2], roomSize[1]]; // [width, height, depth]
        this.roomCenter  = roomCenter;   // [cx, cy, cz]

        // Current room index, but now we consider rooms extending in negative Z
        this.currentRoom = 0;
        this.levelPassed = 0;

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
        if (key === 'p' && !this.isInPathMovement) {
            // Toggle forward/backward each time we press P
            this.isPathForward = !this.isPathForward;

            // Store original position and rotation if starting forward path
            if (this.isPathForward && !this.originalPosition) {
                this.originalPosition = this.camera.position.clone();
                this.originalRotation = this.camera.rotation.clone();
            }

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
                if (!this.isFreeFly) {
                    if (!this.keys.shift) {
                        // Play walk if not already walking
                        this.soundManager.playLoop('walk');
                    }
                }
                break;

            case 'shift':
                this.keys.shift = true;

                // If not free-fly, handle running sounds
                if (!this.isFreeFly) {
                    // Stop walk sound
                    this.soundManager.stopLoop('walk');
                    // Start run sound
                    this.soundManager.playLoop('run');
                }
                break;

            case 'ctrl':
            case 'control':
                this.keys.ctrl = true;

                // Only initiate dash if not free-fly
                if (!this.isFreeFly) {
                    this.initiateDash();
                }
                break;

            case ' ':
                this.keys.space = true;
                // Jump (only in normal mode)
                if (!this.isFreeFly) {
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
                    if (this.keys.w || this.keys.a || this.keys.s || this.keys.d) {
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
                if (!this.isFreeFly) {
                    this.checkStopWalking();
                }
                break;

            case 'shift':
                this.keys.shift = false;
                // In normal mode, stop run sound; possibly resume walk
                if (!this.isFreeFly) {
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
        // Mark that we are in path movement now
        this.isInPathMovement = true;
        this.pathStage = 0;
        this.pathSteps = [];

        // Grab the camera's current Y and Z for the path
        const currentY = this.camera.position.y;
        const currentZ = this.camera.position.z;

        if (this.isPathForward) {
            // FORWARD path steps
            this.pathSteps = [
                // 1) Rotate to face [0, currentY, currentZ]
                { type: 'rotate', target: new THREE.Vector3(0, currentY, currentZ) },
                // 2) Move to [0, currentY, currentZ]
                { type: 'move',   target: new THREE.Vector3(0, currentY, currentZ) },
                // 3) Rotate to face [0, currentY, 0]
                { type: 'rotate', target: new THREE.Vector3(0, currentY, 0) },
                // 4) Move to [0, currentY, -50]
                { type: 'move',   target: new THREE.Vector3(0, currentY, -50) },
                // 5) Rotate to face [0, 0, -50]
                { type: 'rotate', target: new THREE.Vector3(0, 0, -50) },
                // 6) Move to [0, 20, -50]
                { type: 'move',   target: new THREE.Vector3(0, 20, -50) },
            ];
        } else {
            // BACKWARD (reverse) path steps
            // Ensure originalPosition and originalRotation are stored
            if (!this.originalPosition || !this.originalRotation) {
                console.warn("Original position or rotation not stored. Cannot reverse path.");
                this.isInPathMovement = false;
                return;
            }

            this.pathSteps = [
                // 1) Rotate to face [0, 0, -50]
                { type: 'rotate', target: new THREE.Vector3(0, 0, -50) },
                // 2) Move to [0, 20, -50]
                { type: 'move',   target: new THREE.Vector3(0, 20, -50) },
                // 3) Rotate to face [0, currentY, -50]
                { type: 'rotate', target: new THREE.Vector3(0, 20, -50) }, // Assuming currentY is 20 here
                // 4) Move to [0, currentY, -50]
                { type: 'move',   target: new THREE.Vector3(0, 20, -50) },
                // 5) Rotate to face [0, currentY, currentZ]
                { type: 'rotate', target: new THREE.Vector3(this.originalPosition.x, this.originalPosition.y, this.originalPosition.z) },
                // 6) Move back to the original position
                { type: 'move',   target: this.originalPosition.clone() },
            ];

            // Optionally, restore original rotation at the end
            // You can add another step if needed
        }
    }

    // ----------------------------------------------------------------
    // UPDATE PATH MOVEMENT (CALL THIS EACH FRAME IN UPDATE)
    // ----------------------------------------------------------------
    updatePathMovement(deltaTime) {
        // If not in path movement, do nothing
        if (!this.isInPathMovement) return;

        // If we've completed all steps, end path movement
        if (this.pathStage >= this.pathSteps.length) {
            this.isInPathMovement = false;

            // Restore original rotation after backward path
            if (!this.isPathForward && this.originalRotation) {
                this.camera.rotation.copy(this.originalRotation);
                this.updateCameraRotation(); // Ensure quaternion is updated
            }

            return;
        }

        // Get current step
        const step = this.pathSteps[this.pathStage];

        // Decide how big a step to move/rotate this frame
        const moveStep = this.pathMovementSpeed * deltaTime;
        const rotationStep = this.pathRotationSpeed * deltaTime;

        if (step.type === 'move') {
            // Set the pathTarget to the step's target
            this.pathTarget.copy(step.target);
            // If we have arrived, go to next step
            if (this.moveTowardsTarget(moveStep)) {
                this.pathStage++;
            }
        }
        else if (step.type === 'rotate') {
            // Set the target position to calculate rotation
            this.pathTarget.copy(step.target);
            // If we have rotated enough, go to next step
            if (this.rotateTowardsTarget(this.pathTarget, rotationStep)) {
                this.pathStage++;
            }
        }
    }

    // ----------------------------------------------------------------
    // ROTATE TOWARDS TARGET (yaw only; ignoring pitch)
    // ----------------------------------------------------------------
    rotateTowardsTarget(targetPos, rotationStep) {
        // Determine target yaw based on targetPos
        const direction = new THREE.Vector3().subVectors(targetPos, this.camera.position);
        direction.y = 0; // Ignore vertical for yaw
        direction.normalize();

        if (direction.lengthSq() < 1e-6) {
            return true; // No rotation needed
        }

        // Calculate target yaw
        const targetYaw = Math.atan2(direction.x, direction.z);

        // Calculate difference in yaw
        let yawDiff = targetYaw - this.yaw;
        yawDiff = ((yawDiff + Math.PI) % (2 * Math.PI)) - Math.PI; // Normalize to [-π, π]

        if (Math.abs(yawDiff) < rotationStep) {
            this.yaw = targetYaw;
            this.updateCameraRotation();
            return true;
        }

        this.yaw += Math.sign(yawDiff) * rotationStep;
        this.updateCameraRotation();
        return false;
    }

    // ----------------------------------------------------------------
    // MOVE TOWARDS TARGET (this.pathTarget)
    // ----------------------------------------------------------------
    moveTowardsTarget(step) {
        const distance = this.camera.position.distanceTo(this.pathTarget);
        if (distance < step) {
            this.camera.position.copy(this.pathTarget);
            return true;
        }
        const direction = new THREE.Vector3()
            .subVectors(this.pathTarget, this.camera.position)
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
        // 1. Handle path movement if active
        if (this.isInPathMovement) {
            this.updatePathMovement(deltaTime);
            return;
        }

        // 2. Calculate direction vectors from camera orientation
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
        const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();

        // 3. FREE-FLY MODE
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

            // Continue to room boundary checks
        }

        // 4. NORMAL MODE (not free-fly)
        else {
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

                    // Resume walking or running sounds if moving
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
        // 5. CONSTRAIN CAMERA TO THE CURRENT ROOM
        //    (Rooms now extend in the *negative* Z direction)
        // ------------------------------------------------------------

        const camPos = this.camera.position;

        // Unpack room parameters
        const [roomWidth, roomHeight, roomDepth] = this.roomSize;
        const [centerX, centerY, centerZ]        = this.roomCenter;

        // Compute half-sizes
        const halfWidth = roomWidth / 2;
        const halfDepth = roomDepth / 2;

        // Calculate boundaries based on currentRoom
        const zMin = centerZ - (this.currentRoom * roomDepth) - halfDepth + 2;
        const zMax = centerZ - (this.currentRoom * roomDepth) + halfDepth - 2;

        // X/Y bounding box as before
        const xMin = centerX - halfWidth + 2;
        const xMax = centerX + halfWidth - 2;
        const yMin = 2;          // typically the floor
        const yMax = centerY + roomHeight -2; // typically the ceiling

        // Clamp X
        if (camPos.x < xMin) camPos.x = xMin;
        if (camPos.x > xMax) camPos.x = xMax;

        // Optionally clamp Y to the room's ceiling/floor
        if (camPos.y < yMin) camPos.y = yMin;
        if (camPos.y > yMax) camPos.y = yMax;

        // Check Z boundaries for room transitions in the "opposite" direction:

        // If going "forward" in Three.js default, camera.z decreases.
        // So crossing zMin means we move to the NEXT room.
        // Crossing zMax means we move to the PREVIOUS room.

        // Going too far forward (z < zMin)?
        if (camPos.z < zMin) {
            if (
                camPos.x >= this.doorXMin && camPos.x <= this.doorXMax &&
                camPos.y >= this.doorYMin && camPos.y <= this.doorYMax
            ) {
                this.currentRoom++;
            } else {
                // Block movement at zMin
                camPos.z = zMin;
            }
        }

        // Going too far backward (z > zMax)?
        if (camPos.z > zMax) {
            if (
                camPos.x >= this.doorXMin && camPos.x <= this.doorXMax &&
                camPos.y >= this.doorYMin && camPos.y <= this.doorYMax
            ) {
                this.currentRoom--;
                // Optionally, play a different sound when going to the previous room
                // this.soundManager.playSound('prevLevel');
            } else {
                // Block movement at zMax
                camPos.z = zMax;
            }
        }

        // Example logic for level progression sound
        if (this.camera.position.z < -1 * this.levelPassed * roomDepth - 30 && this.currentRoom === this.levelPassed + 1) {
            this.soundManager.playSound("nextLevel");
            this.levelPassed += 1;
        }
    }

    // ----------------------------------------------------------------
    // ROTATE TOWARDS TARGET (yaw only; ignoring pitch)
    // ----------------------------------------------------------------
    rotateTowardsTarget(targetPos, rotationStep) {
        // Direction on the horizontal plane
        const direction = new THREE.Vector3().subVectors(targetPos, this.camera.position);
        direction.y = 0; // ignore vertical for yaw
        direction.normalize();

        if (direction.lengthSq() < 1e-6) {
            return true;
        }

        // Because default camera forward is -Z, use atan2(x, z)
        const targetYaw = Math.atan2(direction.x, direction.z);

        // Current difference in yaw
        let yawDiff = targetYaw - this.yaw;
        yawDiff = ((yawDiff + Math.PI) % (2 * Math.PI)) - Math.PI; // Normalize to [-π, π]

        if (Math.abs(yawDiff) < rotationStep) {
            this.yaw = targetYaw;
            this.updateCameraRotation();
            return true;
        }

        this.yaw += Math.sign(yawDiff) * rotationStep;
        this.updateCameraRotation();
        return false;
    }

    // ----------------------------------------------------------------
    // MOVE TOWARDS TARGET (this.pathTarget)
    // ----------------------------------------------------------------
    moveTowardsTarget(step) {
        const distance = this.camera.position.distanceTo(this.pathTarget);
        if (distance < step) {
            this.camera.position.copy(this.pathTarget);
            return true;
        }
        const direction = new THREE.Vector3()
            .subVectors(this.pathTarget, this.camera.position)
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

}
