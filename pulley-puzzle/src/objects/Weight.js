import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {loadModel} from "../controls/ObjLoader.js";

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

    static async create(scene, physicsWorld, position = [5, 0.5, 5]) {
        const weight = new Weight(scene, physicsWorld, position);
        const modelPath = '../models/5kg.glb';

        // Wait for the model to load
        weight.model = await loadModel(modelPath);
        weight.model.position.set(position[0], position[1], position[2]);
        weight.model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });
        scene.add(weight.model);

        return weight; // Return the fully initialized Weight instance
    }

    update() {
        // Sync Three.js object with Ammo.js physics body
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        if (this.model) {
            this.model.position.set(origin.x(), origin.y(), origin.z());
            this.model.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }
    }
    moveTo(newPosition) {
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        transform.setIdentity();

        // Set the new position
        transform.setOrigin(
            new this.physicsWorld.AmmoLib.btVector3(newPosition[0], newPosition[1], newPosition[2])
        );

        // Optionally preserve the current rotation
        const currentRotation = this.body.getWorldTransform().getRotation();
        transform.setRotation(currentRotation);

        // Apply the new transform to the body
        this.body.setWorldTransform(transform);

        // Reset velocity (optional, if you don't want the body to continue moving)
        this.body.setLinearVelocity(new this.physicsWorld.AmmoLib.btVector3(0, 0, 0));
        this.body.setAngularVelocity(new this.physicsWorld.AmmoLib.btVector3(0, 0, 0));
    }

}
