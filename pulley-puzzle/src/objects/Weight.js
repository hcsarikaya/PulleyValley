import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadModel } from '../controls/ObjLoader.js';

export class Weight {
    constructor(scene, physicsWorld, position = [5, 0.5, 5]) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.category = 'weight';
        this.model = null;
        this.body = null;

        // Ammo.js physics body setup
        const mass = 5;
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

        // Add these flags to ensure proper physics behavior
        this.body.setActivationState(4); // DISABLE_DEACTIVATION
        this.body.setCollisionFlags(0); // DYNAMIC

        this.physicsWorld.physicsWorld.addRigidBody(this.body);
    }

    static async create(scene, physicsWorld, position = [5, 0.5, 5]) {
        const weight = new Weight(scene, physicsWorld, position);
        const modelPath = '../models/5kg.glb';

        weight.model = await loadModel(modelPath);
        weight.model.position.set(position[0], position[1], position[2]);

        weight.model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });

        scene.add(weight.model);

        return weight;
    }

    update() {
        if (!this.model) return;

        const transform = new this.physicsWorld.AmmoLib.btTransform();
        const motionState = this.body.getMotionState();
        if (motionState) {
            motionState.getWorldTransform(transform);
            const origin = transform.getOrigin();
            const rotation = transform.getRotation();

            this.model.position.set(origin.x(), origin.y(), origin.z());
            this.model.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }
    }

    moveTo(camera, distance = 2) {
        if (!this.body || !camera) return;

        // Calculate position in front of camera
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.normalize().multiplyScalar(distance);

        const desiredPosition = camera.position.clone().add(forward);

        // Create and set up the transform
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        const motionState = this.body.getMotionState();

        // First, get current transform
        motionState.getWorldTransform(transform);

        // Update position
        transform.setOrigin(
            new this.physicsWorld.AmmoLib.btVector3(
                desiredPosition.x,
                desiredPosition.y,
                desiredPosition.z
            )
        );

        // Update rotation to match camera
        const cameraQuat = camera.quaternion;
        transform.setRotation(
            new this.physicsWorld.AmmoLib.btQuaternion(
                cameraQuat.x,
                cameraQuat.y,
                cameraQuat.z,
                cameraQuat.w
            )
        );

        // Activate the body and update its transform
        this.body.activate(true);
        motionState.setWorldTransform(transform);
        this.body.setMotionState(motionState);

        // Reset velocities
        const zero = new this.physicsWorld.AmmoLib.btVector3(0, 0, 0);
        this.body.setLinearVelocity(zero);
        this.body.setAngularVelocity(zero);

        // Force an update of the motion state
        this.update();
    }
}