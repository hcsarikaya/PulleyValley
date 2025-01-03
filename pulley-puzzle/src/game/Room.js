import * as THREE from 'three';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';

export class Room {
    constructor(scene, size, physicsWorld) {
        this.size = size;
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        this.wallMaterial = null;
        this.floorMaterial = null;

        // Load textures
        const loader = new THREE.TextureLoader();
        const wallTexture = loader.load('https://threejs.org/manual/examples/resources/images/wall.jpg');
        const floorTexture = loader.load('https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/6176f303...');
        wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(5, 2);
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(5, 5);

        this.wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture });
        this.floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
    }

    createRoom(position) {
        this.position = position || 0;

        // Create and add walls
        this.wallIn = this.createWallWithPhysics(
            [this.size[0], this.size[2], 1],
            [0, this.size[2] / 2, this.size[1] / 2 + this.position]
        );

        this.wallOut = this.createWallWithPhysics(
            [this.size[0], this.size[2], 1],
            [0, this.size[2] / 2, -this.size[1] / 2 + this.position]
        );

        this.wallL = this.createWallWithPhysics(
            [this.size[1], this.size[2], 1],
            [-this.size[0] / 2, this.size[2] / 2, 0 + this.position],
            Math.PI / 2
        );

        this.wallR = this.createWallWithPhysics(
            [this.size[1], this.size[2], 1],
            [this.size[0] / 2, this.size[2] / 2, 0 + this.position],
            Math.PI / 2
        );

        // Create and add floor
        this.floor = this.createWallWithPhysics(
            [this.size[0], 1, this.size[1]],
            [0, -0.5, this.position]
        );

        // Create and add ceiling
        this.ceiling = this.createWallWithPhysics(
            [this.size[0], 1, this.size[1]],
            [0, this.size[2], this.position]
        );
    }

    createWallWithPhysics(size, position, rotationY = 0) {
        // Create the Three.js mesh
        const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const material = this.wallMaterial;
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position[0], position[1], position[2]);
        mesh.rotation.y = rotationY;
        this.scene.add(mesh);

        // Create the Ammo.js physics body
        const mass = 0; // Static object
        const shape = new this.physicsWorld.AmmoLib.btBoxShape(
            new this.physicsWorld.AmmoLib.btVector3(size[0] / 2, size[1] / 2, size[2] / 2)
        );

        const transform = new this.physicsWorld.AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new this.physicsWorld.AmmoLib.btVector3(position[0], position[1], position[2])
        );

        const motionState = new this.physicsWorld.AmmoLib.btDefaultMotionState(transform);
        const bodyInfo = new this.physicsWorld.AmmoLib.btRigidBodyConstructionInfo(mass, motionState, shape);
        const body = new this.physicsWorld.AmmoLib.btRigidBody(bodyInfo);

        this.physicsWorld.physicsWorld.addRigidBody(body);

        return mesh;
    }
}
