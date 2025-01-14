import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadModel } from '../controls/ObjLoader.js';

export class Weight {
    constructor(scene, physicsWorld, position = [5, 0.5, 5], path, mass) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.category = 'weight';
        this.model = null;
        this.body = null;
        this.path = path;
        this.mass = mass;
        // Ammo.js physics body setup

        const shape = new physicsWorld.AmmoLib.btBoxShape(
            new physicsWorld.AmmoLib.btVector3(1.5, 0.75 , 1.5)
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

        // Add visualization for storage areas
        this.createAreaVisualizations(scene);
    }

    static async create(scene, physicsWorld, position = [5, 0.5, 5], path , mass ) {
        const weight = new Weight(scene, physicsWorld, position, path, mass);


        weight.model = await loadModel(path);
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

        // Check if the weight is in specific areas
        this.checkPosition(desiredPosition);

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

    checkPosition(position) {
        const roomSize = 50;
        const roomIndex = window.currentLevel || 0;
        const roomOffset = -roomSize * roomIndex;

        const areas = {
            rightStorage: {
                minX: 20,
                maxX: 35,
                minY: 0,
                maxY: 10,
                minZ: -24 + roomOffset,
                maxZ: -14 + roomOffset
            }
        };

        for (const [areaName, area] of Object.entries(areas)) {
            if (position.x >= area.minX && position.x <= area.maxX &&
                position.y >= area.minY && position.y <= area.maxY &&
                position.z >= area.minZ && position.z <= area.maxZ) {
                console.log(`Weight with mass ${this.mass}kg entered the storage area`);
                return true;
            }
        }
        return false;
    }

    createAreaVisualizations(scene) {
        for (let i = 0; i < 6; i++) {
            const roomOffset = -50 * i;
            
            const areas = [
                {
                    position: new THREE.Vector3(27.5, 5, -19 + roomOffset),
                    size: new THREE.Vector3(15, 10, 10)
                }
            ];

            areas.forEach(area => {
                const geometry = new THREE.BoxGeometry(
                    area.size.x,
                    area.size.y,
                    area.size.z
                );
                const material = new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.5
                });
                const box = new THREE.Mesh(geometry, material);
                box.position.copy(area.position);
                scene.add(box);
            });
        }
    }
}