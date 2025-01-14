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

                    // Store a reference to the physics body in the mesh's userData
                    this.model.userData.physicsBody = this.body;

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


    update() {
        if (!this.body) return;

        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        this.model.position.set(origin.x(), origin.y(), origin.z());
        this.model.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    }
}
