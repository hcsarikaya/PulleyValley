import * as THREE from 'three';

export class CameraControls {
    constructor(camera, renderer, options = {}) {
        this.camera = camera;
        this.renderer = renderer;

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
                this.keys.w = true;
                break;
            case 'a':
                this.keys.a = true;
                break;
            case 's':
                this.keys.s = true;
                break;
            case 'd':
                this.keys.d = true;
                break;
            case ' ':
                // Jump only if not already in the air
                if (!this.isJumping) {
                    this.isJumping = true;
                    this.verticalVelocity = this.jumpSpeed;
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
                break;
            case 'a':
                this.keys.a = false;
                break;
            case 's':
                this.keys.s = false;
                break;
            case 'd':
                this.keys.d = false;
                break;
            case ' ':
                this.keys.space = false;
                break;
            default:
                break;
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

        // Move the camera based on keys pressed
        if (this.keys.w) this.camera.position.addScaledVector(forward, speed);
        if (this.keys.s) this.camera.position.addScaledVector(forward, -speed);
        if (this.keys.a) this.camera.position.addScaledVector(right, -speed);
        if (this.keys.d) this.camera.position.addScaledVector(right, speed);

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
    }
}
