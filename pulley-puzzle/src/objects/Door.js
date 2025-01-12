import * as THREE from 'three';

export class Door {
    constructor(scene,physicsWorld, position =  [0,  3, -10] ) {
        this.scene = scene;
        this.position = position;
        this.physicsWorld = physicsWorld;

        // Create the door geometry and material
        const geometry = new THREE.BoxGeometry(10, 15, 0.5);
        geometry.translate(0, -7.5, 0);
        const material = new THREE.MeshBasicMaterial({ color: 0x787171 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position[0], position[1], position[2]);

        scene.add(this.mesh);

        // Create the Ammo.js rigid body
        const mass = 5; // Dynamic object
        const shape = new this.physicsWorld.AmmoLib.btBoxShape(
            new this.physicsWorld.AmmoLib.btVector3(5, 7.5, 0.25)
        );

        const transform = new this.physicsWorld.AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new this.physicsWorld.AmmoLib.btVector3(position[0], position[1], position[2])
        );

        const motionState = new this.physicsWorld.AmmoLib.btDefaultMotionState(transform);
        const localInertia = new this.physicsWorld.AmmoLib.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const bodyInfo = new this.physicsWorld.AmmoLib.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        this.body = new this.physicsWorld.AmmoLib.btRigidBody(bodyInfo);
        this.physicsWorld.physicsWorld.addRigidBody(this.body);

        this.isOpen = false;
    }

    open() {
        if (!this.isOpen) {
            this.isOpen = true;
            // Animate door opening by moving it upwards
            new THREE.Vector3(0, 6, 0); // Move upward
        }
    }

    update() {
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        this.mesh.position.set(origin.x(), origin.y(), origin.z());
        this.mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    }
}
