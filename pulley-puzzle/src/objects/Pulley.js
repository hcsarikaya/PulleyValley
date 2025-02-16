import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Pulley {
    constructor(scene, physicsWorld, position = [0, 0, 0], scale = 1) {
        this.category = 'pulley';
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.position = position;
        this.scale = scale;
        this.name = null;

        this.mesh = null;
        this.body = null;
        this.model = null;

        this.createPhysicsBody(position);
    }

    async load() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            
            loader.load(
                '../models/pulley.glb',
                (gltf) => {
                    this.model = gltf.scene;
                    
                    // Adjust position to be closer to wall
                    const wallOffset = 1.0; // Distance from wall
                    const adjustedPosition = [
                        this.position[0],
                        this.position[1],
                        this.position[2] + wallOffset // Move towards wall
                    ];
                    this.model.position.set(adjustedPosition[0], adjustedPosition[1], adjustedPosition[2]);
                    this.model.scale.set(this.scale, this.scale, this.scale);
                    
                    // Set rotation to be parallel with wall - 90 degrees around Y-axis
                    this.model.rotation.y = Math.PI / 2;
                    
                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            if (!child.material.isMeshStandardMaterial && !child.material.isMeshPhongMaterial) {
                                child.material = new THREE.MeshStandardMaterial({
                                    color: child.material.color || 0x808080,
                                    metalness: 0.5,
                                    roughness: 0.5
                                });
                            }
                        }
                    });
                    
                    this.scene.add(this.model);
                    this.model.userData.physicsBody = this.body;
                    resolve(this);
                },
                undefined,
                (error) => {
                    console.error('Error loading pulley model:', error);
                    reject(error);
                }
            );
        });
    }

    createPhysicsBody(position) {
        const mass = 0; // Set to 0 for a static object
        const radius = 2;
        const height = 0.5;

        // Create the Ammo.js collision shape (cylinder)
        const shape = new this.physicsWorld.AmmoLib.btCylinderShape(
            new this.physicsWorld.AmmoLib.btVector3(radius, height / 2, radius)
        );

        // Adjust position to be closer to wall
        const wallOffset = 1.0; // Distance from wall
        const adjustedPosition = [
            position[0],
            position[1],
            position[2] + wallOffset // Move towards wall
        ];

        // Set the initial transform with rotation
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new this.physicsWorld.AmmoLib.btVector3(adjustedPosition[0], adjustedPosition[1], adjustedPosition[2])
        );

        // Set rotation to be parallel with wall - 90 degrees around Y-axis
        const rotation = new this.physicsWorld.AmmoLib.btQuaternion();
        rotation.setEulerZYX(0, Math.PI / 2, 0);
        transform.setRotation(rotation);

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
        // Rotate both the mesh and the model
        if (this.mesh) this.mesh.rotation.z += amount;
        if (this.model) this.model.rotation.z += amount;
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

        // Keep the original rotation
        const currentRotation = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(currentRotation);
        const rotation = currentRotation.getRotation();
        transform.setRotation(rotation);

        this.body.getMotionState().setWorldTransform(transform);
        this.body.setWorldTransform(transform);
        
        // Activate the body to ensure physics updates
        this.body.activate();
    }
}
