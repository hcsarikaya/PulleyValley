
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

        this.physicsWorld.physicsWorld.addRigidBody(this.body);
    }

    /**
     * Factory method to create a Weight instance asynchronously
     */
    static async create(scene, physicsWorld, position = [5, 0.5, 5]) {
        const weight = new Weight(scene, physicsWorld, position);
        const modelPath = '../models/5kg.glb';

        // Wait for the model to load
        weight.model = await loadModel(modelPath);
        weight.model.position.set(position[0], position[1], position[2]);

        // Optional: disable shadows (tweak as needed)
        weight.model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });

        scene.add(weight.model);

        return weight; // Return the fully initialized Weight instance
    }

    /**
     * Sync Three.js model with the Ammo.js body transform
     */
    update() {
        if (!this.model) return;

        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        this.model.position.set(origin.x(), origin.y(), origin.z());
        this.model.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    }

    /**
     * Move the weight directly in front of the given camera at the specified distance.
     * This also applies the camera's orientation so the weight is facing the same direction.
     *
     * @param {THREE.Camera} camera - The Three.js camera.
     * @param {number} distance - How far in front of the camera to place the weight.
     */
    moveTo(camera, distance = 2) {
        // 1) Calculate position in front of the camera

        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);  // forward = camera's look direction
        forward.normalize().multiplyScalar(distance);

        // The desired position is camera's position plus the forward vector
        const desiredPosition = new THREE.Vector3().copy(camera.position).add(forward);

        // 2) Create an Ammo.js transform for the new position
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new this.physicsWorld.AmmoLib.btVector3(
                desiredPosition.x,
                desiredPosition.y,
                desiredPosition.z
            )
        );

        // 3) Match the camera’s rotation
        const cameraQuat = camera.quaternion;
        const ammoQuat = new this.physicsWorld.AmmoLib.btQuaternion(
            cameraQuat.x,
            cameraQuat.y,
            cameraQuat.z,
            cameraQuat.w
        );
        transform.setRotation(ammoQuat);

        // 4) Apply this new transform to the physics body
        this.body.setWorldTransform(transform);
        console.log(this.body)
        // 5) (Optional) reset velocity so the object doesn't keep any old momentum
        this.body.setLinearVelocity(new this.physicsWorld.AmmoLib.btVector3(0, 0, 0));
        this.body.setAngularVelocity(new this.physicsWorld.AmmoLib.btVector3(0,0, 0));
    }
}