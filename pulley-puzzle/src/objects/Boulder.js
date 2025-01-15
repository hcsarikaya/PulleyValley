import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Boulder {
    constructor(scene, physicsWorld, position = [0, 0, 0], scale = [1, 1, 1],path, mass = 10) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.mesh = null;
        this.model = null;
        this.body = null;
        this.position = position;
        this.scale = scale;
        this.mass = mass;
        this.category = 'boulder';
        this.name = null;

        this.modelPath = path;
        this.texturePath = '/src/textures/boulder.jpg';

        this.initialMass = mass;
        this.isLifting = false;
        this.targetY = null;

        this.createPhysicsBody(position, scale, mass);
    }

    async load() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                this.modelPath,
                (gltf) => {
                    this.model = gltf.scene;
                    this.model.scale.set(this.scale[0], this.scale[1], this.scale[2]);
                    this.model.position.set(this.position[0], this.position[1], this.position[2]);

                    const textureLoader = new THREE.TextureLoader();
                    textureLoader.load(this.texturePath, (texture) => {
                        texture.colorSpace = THREE.SRGBColorSpace;
                        this.model.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                child.material = new THREE.MeshStandardMaterial({
                                    map: texture,
                                    roughness: 0.9,
                                    metalness: 0.1,
                                    color: 0x666666,
                                    envMapIntensity: 0.5
                                });
                            }
                        });
                    });

                    this.scene.add(this.model);

                   
                    this.model.userData.category = 'boulder';
                    this.model.userData.physicsBody = this.body;
                    this.model.userData.instance = this; 

                    resolve(this);
                },
                undefined,
                (error) => {
                    console.error('Failed to load boulder model:', error);
                    reject(error);
                }
            );
        });
    }

    getMass() {
        if (!this.body) {
            console.error("Boulder physics body is not initialized.");
            return 0;
        }
        return this.body.getMass();
    }

    createPhysicsBody(position, scale, mass) {
        const AmmoLib = this.physicsWorld.AmmoLib;

        // Use a btBoxShape to better match the rock's tall and skinny shape
        const halfExtents = new AmmoLib.btVector3(
            scale[0] / 2, // Half width
            scale[1] / 2,
            scale[2] / 2  // Half depth
        );
        const shape = new AmmoLib.btBoxShape(halfExtents);

        // Set the initial transform
        const transform = new AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(new AmmoLib.btVector3(position[0], position[1], position[2]));

        const motionState = new AmmoLib.btDefaultMotionState(transform);

        // Calculate inertia for the box shape
        const localInertia = new AmmoLib.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        // Create the rigid body
        const bodyInfo = new AmmoLib.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        this.body = new AmmoLib.btRigidBody(bodyInfo);

        // Add the body to the physics world
        this.physicsWorld.physicsWorld.addRigidBody(this.body);
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

    startLifting(targetHeight) {
        this.isLifting = true;
        this.targetY = this.model.position.y + targetHeight;
        this.setMass(0); 
    }

    update() {
        if (!this.body || !this.model) return;

        if (this.isLifting && this.model.position.y < this.targetY) {
            // Update physics body position
            const transform = new this.physicsWorld.AmmoLib.btTransform();
            this.body.getMotionState().getWorldTransform(transform);
            
            // Get current position
            const origin = transform.getOrigin();
            
            // Move up by small increment
            const newY = Math.min(origin.y() + 0.1, this.targetY);
            
            // Update transform
            transform.setOrigin(
                new this.physicsWorld.AmmoLib.btVector3(
                    origin.x(),
                    newY,
                    origin.z()
                )
            );
            
            // Apply new transform
            this.body.getMotionState().setWorldTransform(transform);
            this.body.setWorldTransform(transform);
        }

        // Regular position/rotation update
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        this.model.position.set(origin.x(), origin.y(), origin.z());
        this.model.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
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
