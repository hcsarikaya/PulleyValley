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
        this.moveSpeed        = options.moveSpeed        || 20;
        this.runMultiplier    = options.runMultiplier    || 2; // Speed multiplier when running
        this.dashSpeed        = options.dashSpeed        || 80; // Speed during dash
        this.dashDuration     = options.dashDuration     || 0.2; // Duration of dash in seconds
        this.dashCooldown     = options.dashCooldown     || 0.1;   // Cooldown between dashes in seconds
        this.jumpSpeed        = options.jumpSpeed        || 20;
        this.gravity          = options.gravity          || 20;
        this.mouseSensitivity = options.mouseSensitivity || 0.002;
        this.eyeHeight        = options.eyeHeight        || 7;

        // Camera state
        this.isJumping         = false;
        this.verticalVelocity  = 0;
        this.pitch             = 0; // Rotation around X axis
        this.yaw               = 0; // Rotation around Y axis

        // Dash state
        this.isDashing         = false;
        this.dashTimeRemaining = 0;
        this.lastDashTime      = -Infinity;

        // Keyboard keys
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false,
            shift: false,
            ctrl: false
        };

        // Set an initial camera position or use your own
        this.camera.position.set(0, this.eyeHeight, 5);

        // Pointer lock when clicking on renderer’s canvas
        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });

        // Event listeners
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup',   (e) => this.onKeyUp(e));
        document.addEventListener('mousemove',(e) => this.onMouseMove(e));
    }

    /**
     * Handle key press events
     */
    onKeyDown(event) {
        const key = event.key.toLowerCase();
        switch (key) {
            case 'w':
            case 'a':
            case 's':
            case 'd':
                if (!this.keys[key]) {
                    if (!this.keys.shift) { // Only play walk sound if not running
                        this.soundManager.playLoop('walk');
                    }
                }
                this.keys[key] = true;
                break;
            case 'shift':
                if (!this.keys.shift) {
                    this.keys.shift = true;
                    // Stop walk sound if it's playing
                    this.soundManager.stopLoop('walk');
                    // Start run sound
                    this.soundManager.playLoop('run');
                }
                break;
            case 'ctrl':
            case 'control':
                if (!this.keys.ctrl) {
                    this.keys.ctrl = true;
                    this.initiateDash();
                }
                break;
            case ' ':
                // Jump only if not already in the air
                if (!this.isJumping) {
                    this.isJumping = true;
                    this.verticalVelocity = this.jumpSpeed;
                    this.soundManager.playSound('jump');
                }
                break;
            default:
                break;
        }
    }

    /**
     * Handle key release events
     */
    onKeyUp(event) {
        const key = event.key.toLowerCase();
        switch (key) {
            case 'w':
            case 'a':
            case 's':
            case 'd':
                this.keys[key] = false;
                this.checkStopWalking();
                break;
            case 'shift':
                if (this.keys.shift) {
                    this.keys.shift = false;
                    // Stop run sound
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

    /**
     * Check if any movement keys are still pressed; if not, stop walking sound
     */
    checkStopWalking() {
        const isMoving = this.keys.w || this.keys.a || this.keys.s || this.keys.d;
        if (!isMoving) {
            this.soundManager.stopLoop('walk');
        }
    }

    /**
     * Handle mouse movement for looking around (pitch & yaw)
     */
    onMouseMove(event) {
        // Only rotate if pointer is locked on the renderer
        if (document.pointerLockElement !== this.renderer.domElement) return;

        // Yaw (left/right) and Pitch (up/down)
        this.yaw   -= event.movementX * this.mouseSensitivity;
        this.pitch -= event.movementY * this.mouseSensitivity;

        // Clamp pitch so you can’t flip the camera fully
        const maxPitch = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

        // Update the camera rotation using Euler angles
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);
    }

    /**
     * Initiate a dash if cooldown allows
     */
    initiateDash() {
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

    /**
     * Update function (call every frame or in your render loop)
     */
    update(deltaTime) {
        // Calculate direction vectors from camera orientation
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right   = new THREE.Vector3(1, 0,  0).applyQuaternion(this.camera.quaternion);

        // Zero out Y so movement is restricted to horizontal plane
        forward.y = 0;
        right.y   = 0;
        forward.normalize();
        right.normalize();

        // Determine current speed
        let speed = this.moveSpeed;

        if (this.keys.shift && !this.isDashing) {
            speed *= this.runMultiplier;
        }

        // Movement speed factor
        const velocity = speed * deltaTime;

        let isMoving = false;

        // Move the camera based on keys pressed
        if (this.keys.w) {
            this.camera.position.addScaledVector(forward, velocity);
            isMoving = true;
        }
        if (this.keys.s) {
            this.camera.position.addScaledVector(forward, -velocity);
            isMoving = true;
        }
        if (this.keys.a) {
            this.camera.position.addScaledVector(right, -velocity);
            isMoving = true;
        }
        if (this.keys.d) {
            this.camera.position.addScaledVector(right, velocity);
            isMoving = true;
        }

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
            this.soundManager.stopLoop('walk');
            this.soundManager.stopLoop("run");
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

        // Optional: Additional sound effects based on actions
    }
}
