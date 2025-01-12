import * as THREE from 'three';
import SoundManager from "../game/SoundManager.js";

export class CameraControls {
    constructor(camera, renderer, options = {}) {
        this.camera = camera;
        this.renderer = renderer;
        this.soundManager = new SoundManager();

        // Load sounds
        this.soundManager.loadSounds();

        // Start background music
        this.soundManager.playMusic();

        // Movement settings
        this.moveSpeed = options.moveSpeed || 20;
        this.runMultiplier = options.runMultiplier || 2;  // Speed multiplier when running (or flying faster)
        this.dashSpeed = options.dashSpeed || 80; // Speed during dash
        this.dashDuration = options.dashDuration || 0.2;
        this.dashCooldown = options.dashCooldown || 0.1;
        this.jumpSpeed = options.jumpSpeed || 20;
        this.gravity = options.gravity || 20;
        this.mouseSensitivity = options.mouseSensitivity || 0.002;
        this.eyeHeight = options.eyeHeight || 7;

        // Camera state
        this.isJumping = false;
        this.verticalVelocity = 0;
        this.pitch = 0; // Rotation around X axis
        this.yaw = 0; // Rotation around Y axis

        // Dash state
        this.isDashing = false;
        this.dashTimeRemaining = 0;
        this.lastDashTime = -Infinity;

        // Free-fly mode
        this.isFreeFly = false; // Toggled by pressing E

        // Path movement state
        this.isInPathMovement = false;
        this.pathStage = 0; // 0: not started, 1: moving to ground, 2: moving to origin, 3: rotating
        this.pathTarget = new THREE.Vector3();
        this.pathStartPosition = new THREE.Vector3();
        this.pathStartRotation = new THREE.Euler();
        this.pathMovementSpeed = options.pathMovementSpeed || 80;
        this.pathRotationSpeed = options.pathRotationSpeed || 5;

        // Keyboard keys
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false,
            shift: false,
            ctrl: false,
            e: false,
            p: false
        };

        // Set an initial camera position
        this.camera.position.set(0, this.eyeHeight, 5);

        // Pointer lock when clicking on renderer's canvas
        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });

        // Event listeners
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onKeyDown(event) {
        const key = event.key.toLowerCase();

        // Handle P key for path movement
        if (key === 'p' && !this.isInPathMovement) {
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
                    // If SHIFT not pressed and we just started moving
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
                // Toggle free fly
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
                        // If SHIFT is also pressed, play run; else play walk
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
                    // If movement keys are still pressed, start walk sound
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

    checkStopWalking() {
        const isMoving = this.keys.w || this.keys.a || this.keys.s || this.keys.d;
        if (!isMoving) {
            this.soundManager.stopLoop('walk');
        }
    }

    onMouseMove(event) {
        // Only rotate if pointer is locked on the renderer
        if (document.pointerLockElement !== this.renderer.domElement) return;

        // Yaw (left/right) and Pitch (up/down)
        this.yaw -= event.movementX * this.mouseSensitivity;
        this.pitch -= event.movementY * this.mouseSensitivity;

        // Clamp pitch so you can't flip the camera fully
        const maxPitch = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

        // Update the camera rotation using Euler angles
        this.updateCameraRotation();
    }

    initiateDash() {
        // If already in free-fly, no dash
        if (this.isFreeFly) return;

        const currentTime = performance.now() / 1000; // Convert to seconds
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

    startPathMovement() {
        this.isInPathMovement = true;
        this.pathStage = 1;
        this.pathStartPosition.copy(this.camera.position);
        this.pathStartRotation.copy(this.camera.rotation);

        // Set initial target to ground position
        this.pathTarget.set(0, this.camera.position.y, this.camera.position.z);

        // Disable other movement controls
        Object.keys(this.keys).forEach(key => this.keys[key] = false);
    }

    updatePathMovement(deltaTime) {
        if (!this.isInPathMovement) return;

        const moveStep = this.pathMovementSpeed * deltaTime;
        const rotationStep = this.pathRotationSpeed * deltaTime;

        switch (this.pathStage) {
            case 1: // Moving to ground
                if (this.moveTowardsTarget(moveStep)) {
                    this.pathStage = 2;
                    this.pathTarget.set(0, this.camera.position.y, 0);
                }
                break;

            case 2: // Moving to origin
                if (this.moveTowardsTarget(moveStep)) {
                    this.pathStage = 3;
                    // Store target rotation (facing +z)
                    this.pathTarget.set(0, this.camera.position.y, 0);
                    this.pitch = 0;
                }
                break;

            case 3: // Rotating to face +z
                const targetYaw = 0;
                const yawDiff = targetYaw - this.yaw;

                if (Math.abs(yawDiff) < rotationStep) {
                    this.yaw = targetYaw;
                    this.updateCameraRotation();
                    this.isInPathMovement = false;
                    return;
                }

                this.yaw += Math.sign(yawDiff) * rotationStep;
                this.updateCameraRotation();
                break;
        }
    }

    moveTowardsTarget(step) {
        const direction = new THREE.Vector3()
            .subVectors(this.pathTarget, this.camera.position)
            .normalize();

        const distance = this.camera.position.distanceTo(this.pathTarget);

        if (distance < step) {
            this.camera.position.copy(this.pathTarget);
            return true;
        }

        this.camera.position.add(direction.multiplyScalar(step));
        return false;
    }

    updateCameraRotation() {
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);
    }

    update(deltaTime) {
        // Handle path movement if active
        if (this.isInPathMovement) {
            this.updatePathMovement(deltaTime);
            return;
        }

        // Calculate direction vectors from camera orientation
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();

        // FREE-FLY MODE
        if (this.isFreeFly) {
            // In free-fly, no gravity or jump logic. SHIFT = fly faster.
            let speed = this.moveSpeed;
            if (this.keys.shift) {
                speed *= this.runMultiplier;
            }
            const velocity = speed * deltaTime;

            // Move horizontally
            if (this.keys.w) this.camera.position.addScaledVector(forward, velocity);
            if (this.keys.s) this.camera.position.addScaledVector(forward, -velocity);
            if (this.keys.a) this.camera.position.addScaledVector(right, -velocity);
            if (this.keys.d) this.camera.position.addScaledVector(right, velocity);

            // Move vertically if you want SPACE/CTRL to go up/down
            if (this.keys.space) {
                this.camera.position.y += velocity;
            }
            if (this.keys.ctrl) {
                this.camera.position.y -= velocity;
            }

            // Ignore dashing, jumping, gravity, etc.
            return;
        }

        // NORMAL MODE (not free-fly)
        // Zero out Y for movement so it's only horizontal
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();

        // Determine current speed
        let speed = this.moveSpeed;
        if (this.keys.shift && !this.isDashing) {
            speed *= this.runMultiplier;
        }

        // Movement speed factor
        const velocity = speed * deltaTime;

        // Move the camera based on keys pressed
        if (this.keys.w) this.camera.position.addScaledVector(forward, velocity);
        if (this.keys.s) this.camera.position.addScaledVector(forward, -velocity);
        if (this.keys.a) this.camera.position.addScaledVector(right, -velocity);
        if (this.keys.d) this.camera.position.addScaledVector(right, velocity);

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

            // Check if landed (below or at eye height)
            if (this.camera.position.y <= this.eyeHeight) {
                this.camera.position.y = this.eyeHeight;
                this.isJumping = false;
                this.verticalVelocity = 0;
            }
        } else {
            // Keep camera at a fixed eye height if not jumping
            this.camera.position.y = this.eyeHeight;
        }
    }
}