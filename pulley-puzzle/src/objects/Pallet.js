import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Pallet {
    constructor(scene, physicsWorld, position = [0, 1, 0], scale = [1, 1, 1], path) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.category = 'pallet';
        this.mesh = null;
        this.body = null;
        this.scale = scale;
        this.weights = [];
        this.path = path;
        this.position = position;

        this.createPhysicsBody(position);
    }

    async load() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                this.path,
                (glb) => {
                    this.mesh = glb.scene;
                    this.mesh.position.set(this.position[0], this.position[1], this.position[2]);
                    this.mesh.scale.set(this.scale[0], this.scale[1], this.scale[2]);
                    this.mesh.rotation.y = Math.PI / 2;

                    this.mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x4a3520,
                                roughness: 0.85,
                                metalness: 0.0,
                                envMapIntensity: 0.3
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

                    resolve(this);
                },
                undefined,
                (error) => {
                    console.error('Error loading pallet model:', error);
                    reject(error);
                }
            );
        });
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

    addWeight(weight) {
        this.weights.push(weight);
    }

    removeWeight(weight) {
        const index = this.weights.indexOf(weight);
        if (index > -1) {
            this.weights.splice(index, 1);
        }
    }

    calculateTotalMass() {
        return this.weights.reduce((total, weight) => total + weight.body.getMass(), 0);
    }

    update() {
        if (!this.body || !this.mesh) return;

        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        this.mesh.position.set(origin.x(), origin.y(), origin.z());
        this.mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    }
}
