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
        this.moveSpeed       = options.moveSpeed       || 10;
        this.jumpSpeed       = options.jumpSpeed       || 20;
        this.gravity         = options.gravity         || 20;
        this.mouseSensitivity= options.mouseSensitivity|| 0.002;
        this.eyeHeight       = options.eyeHeight       || 7;

        // Camera state
        this.isJumping = false;
        this.verticalVelocity = 0;
        this.pitch = 0; // Rotation around X axis
        this.yaw   = 0; // Rotation around Y axis

        // Keyboard keys
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false
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
        switch (event.key.toLowerCase()) {
            case 'w':
                if (!this.keys.w) {
                    this.soundManager.playLoop('walk');
                }
                this.keys.w = true;
                break;
            case 'a':
                if (!this.keys.a) {
                    this.soundManager.playLoop('walk');
                }
                this.keys.a = true;
                break;
            case 's':
                if (!this.keys.s) {
                    this.soundManager.playLoop('walk');
                }
                this.keys.s = true;
                break;
            case 'd':
                if (!this.keys.d) {
                    this.soundManager.playLoop('walk');
                }
                this.keys.d = true;
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
        switch (event.key.toLowerCase()) {
            case 'w':
                this.keys.w = false;
                this.checkStopWalking();
                break;
            case 'a':
                this.keys.a = false;
                this.checkStopWalking();
                break;
            case 's':
                this.keys.s = false;
                this.checkStopWalking();
                break;
            case 'd':
                this.keys.d = false;
                this.checkStopWalking();
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

        // Movement speed factor
        const speed = this.moveSpeed * deltaTime;

        let isMoving = false;

        // Move the camera based on keys pressed
        if (this.keys.w) {
            this.camera.position.addScaledVector(forward, speed);
            isMoving = true;
        }
        if (this.keys.s) {
            this.camera.position.addScaledVector(forward, -speed);
            isMoving = true;
        }
        if (this.keys.a) {
            this.camera.position.addScaledVector(right, -speed);
            isMoving = true;
        }
        if (this.keys.d) {
            this.camera.position.addScaledVector(right, speed);
            isMoving = true;
        }

        // Optionally, handle continuous sound playing based on movement state
        // For example, if using footsteps with footsteps sound frequency based on speed
        // This example uses a simple looping walk sound

        // Jumping and gravity
        if (this.isJumping) {
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

        // Optionally, add other sound effects based on actions here
        // e.g., footsteps intensity based on movement speed, landing sounds, etc.
    }
}
