import * as THREE from 'three';

export class Player {
    constructor(scene, camera, physicsWorld) {
        this.scene = scene;
        this.camera = camera;
        this.physicsWorld = physicsWorld;
        this.speed = 0.1;


        // Player's 3D model (a simple cube for now)
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.position.set(this.camera.position.x,this.camera.position.y-3, this.camera.position.z); // Start at the center of the room

        scene.add(this.mesh);
        this.createPhysicsBody([this.camera.position.x,this.camera.position.y-3, this.camera.position.z]);

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

        }
    }
    createPhysicsBody(position) {
        const mass = 1; // Set to 0 for a static object
        const radius = 2;
        const height = 0.5;

        // Create the Ammo.js collision shape (cylinder)
        const shape = new this.physicsWorld.AmmoLib.btCylinderShape(
            new this.physicsWorld.AmmoLib.btVector3(radius, height / 2, radius)
        );

        // Set the initial transform
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new this.physicsWorld.AmmoLib.btVector3(position[0], position[1], position[2])
        );

        const motionState = new this.physicsWorld.AmmoLib.btDefaultMotionState(transform);

        // Static objects don't require inertia
        const localInertia = new this.physicsWorld.AmmoLib.btVector3(0, 0, 0);

        // Create the rigid body
        const bodyInfo = new this.physicsWorld.AmmoLib.btRigidBodyConstructionInfo(
            mass,
            motionState,
            shape,
            localInertia
        );

        this.body = new this.physicsWorld.AmmoLib.btRigidBody(bodyInfo);
        this.mesh.userData.physicsBody = this.body;
        this.physicsWorld.physicsWorld.addRigidBody(this.body);
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

        this.mesh.position.set(this.camera.position.x,this.camera.position.y-3,this.camera.position.z);
        if (!this.body) return;

        // Sync the Three.js mesh with the Ammo.js body
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        if (this.mesh) {
            this.mesh.position.set(this.camera.position.x,0,this.camera.position.z);
            this.mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }


    }

}
