import * as THREE from 'three';

export class Player {
    constructor(scene) {
        this.scene = scene;

        this.speed = 0.1;


        // Player's 3D model (a simple cube for now)
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 1, 0); // Start at the center of the room
        scene.add(this.mesh);

        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;



        // Add keyboard listeners
        this.addKeyboardControls();

    }

    addKeyboardControls() {
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        switch (event.key) {
            case 'w':
            case 'W':
                this.moveForward = true;
                break;
            case 's':
            case 'S':
                this.moveBackward = true;
                break;
            case 'a':
            case 'A':
                this.moveLeft = true;
                break;
            case 'd':
            case 'D':
                this.moveRight = true;
                break;
            case 'e':
            case 'E':
                this.checkInteraction();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.key) {
            case 'w':
            case 'W':
                this.moveForward = false;
                break;
            case 's':
            case 'S':
                this.moveBackward = false;
                break;
            case 'a':
            case 'A':
                this.moveLeft = false;
                break;
            case 'd':
            case 'D':
                this.moveRight = false;
                break;
        }
    }

    update() {
        const velocity = new THREE.Vector3();

        if (this.moveForward) velocity.z -= this.speed;
        if (this.moveBackward) velocity.z += this.speed;
        if (this.moveLeft) velocity.x -= this.speed;
        if (this.moveRight) velocity.x += this.speed;

        this.mesh.position.add(velocity);

    }
    checkInteraction() {
        console.log("open door");

    }
}
