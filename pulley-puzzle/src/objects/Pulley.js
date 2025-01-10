import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Pulley {
    constructor(scene,physicsWorld, position = [ 5,  5,  0 ], material) {
        this.category = 'Pulley';
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        this.mesh = null; // Three.js mesh
        this.body = null; // Ammo.js rigid body
        this.model = null; // Loaded GLTF model

        // Create material
        this.material = material || new THREE.MeshBasicMaterial({ color: 0xffd700 });

        // Create basic pulley geometry (fallback for physics)
        const geometry = new THREE.CylinderGeometry(2, 2, 0.5, 32);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(position[0], position[1], position[2]);
        this.mesh.rotation.x = Math.PI / 2;
        scene.add(this.mesh);

        // Add the Ammo.js physics body
        this.createPhysicsBody(position);

        // Load the GLTF model (optional visual enhancement)
        const loader = new GLTFLoader();
        loader.load(
            '../public/models/pulley.glb',
            (glb) => {
                this.model = glb.scene;
                this.model.position.copy(this.mesh.position);
                this.model.rotation.copy(this.mesh.rotation);
                scene.add(this.model);
            },
            undefined,
            (error) => {
                console.error('Failed to load pulley model:', error);
            }
        );
    }

    createPhysicsBody(position) {
        const mass = 0; // Set to 0 for a static object
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

    update() {
        if (!this.body) return;

        // Sync the Three.js mesh with the Ammo.js body
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        if (this.mesh) {
            this.mesh.position.set(origin.x(), origin.y(), origin.z());
            this.mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }

        if (this.model) {
            this.model.position.set(origin.x(), origin.y(), origin.z());
            this.model.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }
    }

    rotate(amount) {
        if (this.mesh) this.mesh.rotation.z += amount;
        if (this.model) this.model.rotation.z += amount;
    }

}
