import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Boulder {
    constructor(scene, physicsWorld, position = [0, 0, 0], scale = [1, 1, 1], mass = 10) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.mesh = null; // Three.js mesh
        this.body = null; // Ammo.js rigid body

        const modelPath = '../public/models/kaya2.glb';
        const texturePath = '/src/textures/boulder.jpg';

        this.category = 'boulder';


        // Load the GLTF model
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                this.mesh = gltf.scene;
                this.mesh.scale.set(scale[0], scale[1], scale[2]);
                this.mesh.position.set(position[0], position[1], position[2]);


                const textureLoader = new THREE.TextureLoader();
                textureLoader.load(texturePath, (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    this.mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.material = new THREE.MeshStandardMaterial({
                                map: texture,
                                roughness: 0.9,        // Very rough surface
                                metalness: 0.1,        // Low metalness for rock
                                color: 0x666666,       // Darker base color
                                envMapIntensity: 0.5   // Reduce environment lighting
                            });
                        }
                    });
                });



                scene.add(this.mesh);

                // Create Ammo.js physics body after model is loaded
                this.createPhysicsBody(position, scale, mass);
            },
            undefined,
            (error) => {
                console.error('Failed to load boulder model:', error);
            }
        );
    }

    createPhysicsBody(position, scale, mass) {
        const AmmoLib = this.physicsWorld.AmmoLib;

        // Approximate the shape as a sphere based on the scale
        const radius = Math.max(...scale) / 2;
        const shape = new AmmoLib.btSphereShape(radius);

        // Set the initial transform
        const transform = new AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(new AmmoLib.btVector3(position[0], position[1], position[2]));

        const motionState = new AmmoLib.btDefaultMotionState(transform);

        // Calculate inertia
        const localInertia = new AmmoLib.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        // Create the rigid body
        const bodyInfo = new AmmoLib.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        this.body = new AmmoLib.btRigidBody(bodyInfo);

        // Store a reference to the physics body in the mesh's userData
        this.mesh.userData.physicsBody = this.body;

        // Add the body to the physics world
        this.physicsWorld.physicsWorld.addRigidBody(this.body);
    }

    update() {
        if (!this.body) return;

        // Sync the Three.js mesh with the Ammo.js body
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        this.body.getMotionState().getWorldTransform(transform);

        const origin = transform.getOrigin();
        const rotation = transform.getRotation();

        this.mesh.position.set(origin.x(), origin.y(), origin.z());
        this.mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    }
}
