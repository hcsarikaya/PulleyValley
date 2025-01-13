import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Pallet {
    constructor(scene, physicsWorld, position = [0, 1, 0], scale = [1, 1, 1]) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.category = 'pallet';
        this.mesh = null;
        this.body = null;
        this.scale = scale;

        this.createPhysicsBody(position);

        this.loadModel(position);

    }

    loadModel(position) {
        const loader = new GLTFLoader();
        loader.load(
            '../models/palett.glb', // Path to the pallet GLB file
            (glb) => {
                this.mesh = glb.scene;
                this.mesh.position.set(position[0], position[1], position[2]);
                this.mesh.scale.set(this.scale[0], this.scale[1], this.scale[2]);

                // Apply material settings to all meshes
                this.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Create a darker, more realistic wood material
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x4a3520,      // Dark wood color
                            roughness: 0.85,      // Very rough surface
                            metalness: 0.0,       // No metalness for wood
                            envMapIntensity: 0.3  // Reduce environment lighting
                        });
                    }
                });

                this.scene.add(this.mesh);

                // Sync physics body position
                if (this.body) {
                    const transform = new this.physicsWorld.AmmoLib.btTransform();
                    this.body.getMotionState().getWorldTransform(transform);
                    const origin = transform.getOrigin();
                    this.mesh.position.set(origin.x(), origin.y(), origin.z());
                }
            },
            undefined,
            (error) => {
                console.error('Error loading pallet model:', error);
            }
        );
    }

    createPhysicsBody(position) {
        const size = [3 * this.scale[0], 1.5 * this.scale[1], 3 * this.scale[2]];
        const mass = 10; // Adjust the mass as needed
        const shape = new this.physicsWorld.AmmoLib.btBoxShape(
            new this.physicsWorld.AmmoLib.btVector3(size[0] / 2, size[1] / 2, size[2] / 2)
        );

        const transform = new this.physicsWorld.AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new this.physicsWorld.AmmoLib.btVector3(position[0], position[1], position[2])
        );

        const motionState = new this.physicsWorld.AmmoLib.btDefaultMotionState(transform);
        const localInertia = new this.physicsWorld.AmmoLib.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const bodyInfo = new this.physicsWorld.AmmoLib.btRigidBodyConstructionInfo(
            mass,
            motionState,
            shape,
            localInertia
        );

        this.body = new this.physicsWorld.AmmoLib.btRigidBody(bodyInfo);

        this.physicsWorld.physicsWorld.addRigidBody(this.body);
    }

    update() {
        // Sync the Three.js model with Ammo.js physics body
        if (!this.body || !this.mesh) return;

        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        this.mesh.position.set(origin.x(), origin.y(), origin.z());
        this.mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    }
}
