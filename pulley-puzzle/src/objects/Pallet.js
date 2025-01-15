import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Pallet {
    constructor(scene, physicsWorld, position = [0, 1, 0], scale = [1, 1, 1], path) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.category = 'pallet';
        this.mesh = null;
        this.body = null;
        this.model = null;
        this.scale = scale;
        this.weights = [];
        this.path = path;
        this.position = position;
        this.name = null;
        this.initialY = position[1];
        this.isDropping = false;

        this.createPhysicsBody(position);
    }

    async load() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                this.path,
                (glb) => {
                    this.model = glb.scene;
                    this.model.position.set(this.position[0], this.position[1], this.position[2]);
                    this.model.scale.set(this.scale[0], this.scale[1], this.scale[2]);
                    this.model.rotation.y = Math.PI / 2;

                    this.model.traverse((child) => {
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

                    this.scene.add(this.model);
                    this.model.userData.physicsBody = this.body;
                    this.model.userData.category = 'pallet';
                    this.model.userData.instance = this;

                    // Sync physics body position
                    if (this.body) {
                        const transform = new this.physicsWorld.AmmoLib.btTransform();
                        this.body.getMotionState().getWorldTransform(transform);
                        const origin = transform.getOrigin();
                        this.model.position.set(origin.x(), origin.y(), origin.z());
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
        const mass = 0; // Initial mass is 0
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
        
        // Make sure the body can move and rotate
        this.body.setActivationState(4); // DISABLE_DEACTIVATION
        this.body.setCollisionFlags(0); // Clear all flags to ensure normal physics behavior

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

    setMass(mass) {
        if (!this.body) return;
        
        // Create a new btVector3 for local inertia
        const localInertia = new this.physicsWorld.AmmoLib.btVector3(0, 0, 0);
        
        // Recalculate local inertia with new mass
        const shape = this.body.getCollisionShape();
        shape.calculateLocalInertia(mass, localInertia);
        
        // Set the new mass properties
        this.body.setMassProps(mass, localInertia);
        this.body.updateInertiaTensor();
        
        // Activate the body to ensure physics updates
        this.body.activate(true);
    }

    startDropping() {
        this.isDropping = true;
        this.setMass(100); // Set a heavy mass
        
        // Ensure the body is active and can move
        this.body.activate(true);
        this.body.setActivationState(1); // ACTIVE_TAG
        
        // Clear any velocity constraints
        const zero = new this.physicsWorld.AmmoLib.btVector3(0, 0, 0);
        this.body.setLinearVelocity(zero);
        this.body.setAngularVelocity(zero);
        
        // Apply a small initial impulse downward to start the motion
        const downwardImpulse = new this.physicsWorld.AmmoLib.btVector3(0, -1, 0);
        this.body.applyCentralImpulse(downwardImpulse);
    }

    update() {
        if (!this.body || !this.model) return;

        const transform = new this.physicsWorld.AmmoLib.btTransform();
        const motionState = this.body.getMotionState();
        
        if (motionState) {
            motionState.getWorldTransform(transform);
            const origin = transform.getOrigin();
            const rotation = transform.getRotation();

            this.model.position.set(origin.x(), origin.y(), origin.z());
            this.model.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());

            // Optional: Stop dropping when reaching a certain height
            if (this.isDropping && origin.y() <= 0.5) {
                this.isDropping = false;
                this.setMass(0);

                // Reset the transform to ensure it stays at the minimum height
                transform.setOrigin(
                    new this.physicsWorld.AmmoLib.btVector3(
                        origin.x(),
                        0.5,
                        origin.z()
                    )
                );
                motionState.setWorldTransform(transform);
                this.body.setMotionState(motionState);
            }
        }
    }

    moveTo(camera, distance) {
        if (!this.body || !this.model) return;

        // Calculate target position in front of camera
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(camera.quaternion);
        const targetPosition = new THREE.Vector3();
        targetPosition.copy(camera.position).add(cameraDirection.multiplyScalar(distance));

        // Update physics body position
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(new this.physicsWorld.AmmoLib.btVector3(
            targetPosition.x,
            targetPosition.y - 1, // Offset slightly below camera view
            targetPosition.z
        ));

        this.body.getMotionState().setWorldTransform(transform);
        this.body.setWorldTransform(transform);
        
        // Activate the body to ensure physics updates
        this.body.activate();
    }
}
