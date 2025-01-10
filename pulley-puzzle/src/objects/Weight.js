import * as THREE from 'three';

export class Weight {
    constructor(scene,physicsWorld, position = [ 5,  0.5,  5 ]) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.category = 'weight';
        /// Three.js geometry for the weight
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position[0], position[1], position[2]);
        scene.add(this.mesh);

        // Ammo.js physics body
        const mass = 5; // Adjust as needed
        const shape = new physicsWorld.AmmoLib.btBoxShape(
            new physicsWorld.AmmoLib.btVector3(0.5, 0.5, 0.5)
        );

        const transform = new physicsWorld.AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new physicsWorld.AmmoLib.btVector3(position[0], position[1], position[2])
        );

        const motionState = new physicsWorld.AmmoLib.btDefaultMotionState(transform);

        const localInertia = new physicsWorld.AmmoLib.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const bodyInfo = new physicsWorld.AmmoLib.btRigidBodyConstructionInfo(
            mass,
            motionState,
            shape,
            localInertia
        );

        this.body = new physicsWorld.AmmoLib.btRigidBody(bodyInfo);
        this.mesh.userData.physicsBody = this.body;
        physicsWorld.physicsWorld.addRigidBody(this.body);
    }

    update() {
        // Sync Three.js object with Ammo.js physics body
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        this.mesh.position.set(origin.x(), origin.y(), origin.z());
        this.mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    }
}
