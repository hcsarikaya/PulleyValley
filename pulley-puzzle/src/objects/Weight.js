// Weight.js

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Weight {
    constructor(scene, physicsWorld, position = [5, 0.5, 5]) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.category = 'weight';
        this.model = null;
        this.body = null;

        const modelPath = '../models/5kg.glb';

        // Load GLTF model
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(position[0], position[1], position[2]);

                // Enable cast/receive shadows on all sub-meshes
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Ensure material reacts to light by using MeshStandardMaterial
                        if (!child.material.isMeshStandardMaterial && !child.material.isMeshPhongMaterial) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: child.material.color || 0x808080,
                                metalness: 0.7,  // Make it look metallic
                                roughness: 0.3   // Make it somewhat shiny
                            });
                        }
                    }
                });
                scene.add(this.model);
            },
            undefined,
            (error) => {
                console.error('Error loading GLTF model:', error);
            }
        );

        // Ammo.js physics body
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
            mass, motionState, shape, localInertia
        );

        this.body = new physicsWorld.AmmoLib.btRigidBody(bodyInfo);
        this.physicsWorld.physicsWorld.addRigidBody(this.body);
    }

    update() {
        // Sync with Ammo.js
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        if (this.model) {
            this.model.position.set(origin.x(), origin.y(), origin.z());
            this.model.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }
    }
}
