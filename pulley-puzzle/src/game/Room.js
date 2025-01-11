import * as THREE from 'three';

import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { woodVertexShader, woodFragmentShader } from '../shaders/WoodShader.js';

export class Room{
    constructor(scene, size, physicsWorld){
        this.size = size;
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        this.wallIn;
        this.wallOut;
        this.wallL;
        this.wallR;
        this.floor;
        this.ceiling;
        this.position;

        const loader = new THREE.TextureLoader();

        const wallTexture = loader.load('https://threejs.org/manual/examples/resources/images/wall.jpg');
        const floorTexture = loader.load('https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/6176f303-518c-4b9f-a201-b6fe1b4239b2/d6xlhqd-f35f4ff4-2fb0-4396-8640-ccb1ab5ac076.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzYxNzZmMzAzLTUxOGMtNGI5Zi1hMjAxLWI2ZmUxYjQyMzliMlwvZDZ4bGhxZC1mMzVmNGZmNC0yZmIwLTQzOTYtODY0MC1jY2IxYWI1YWMwNzYucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Jd-8zva1jG355B9yMCWHRKGI50mKb-tcCVIIX-FMPlI');
        wallTexture.colorSpace = THREE.SRGBColorSpace;
        floorTexture.colorSpace = THREE.SRGBColorSpace;

        // Repeat and wrap textures for better appearance
        wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(5, 2); // Adjust based on your texture size
        this.wallMaterial = new THREE.MeshBasicMaterial({color: 0xFF8844, map: wallTexture});

        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(5, 5);
        this.floorMaterial = new THREE.MeshBasicMaterial({color: 0xFF8844, map: floorTexture});

    }
    createRoom(position) {
        this.position = position ? position :0;

        this.wallIn = this.createWallWithDoorPhysics(
            [this.size[0], this.size[2], 1],
            [0, this.size[2] / 2, this.size[1] / 2 + this.position]
        );

        this.wallOut = this.createWallWithDoorPhysics(
            [this.size[0], this.size[2], 1],
            [0, this.size[2] / 2, -this.size[1] / 2 + this.position]
        );


        this.wallL = this.createWallWithPhysics(
            [this.size[1], this.size[2], 1],
            [-this.size[0] / 2, this.size[2] / 2, 0 + this.position],
            Math.PI / 2
        );
        this.scene.add(this.wallL)
        this.wallR = this.createWallWithPhysics(
            [this.size[1], this.size[2], 1],
            [this.size[0] / 2, this.size[2] / 2, 0 + this.position],
            Math.PI / 2
        );
        this.scene.add(this.wallR);

        // Create and add floor
        this.floor = this.createFloorWithWoodShader(
            [this.size[0], 1, this.size[1]],
            [0, -0.5, this.position]
        );
        this.scene.add(this.floor);

        // Create and add ceiling
        this.ceiling = this.createWallWithPhysics(
            [this.size[0], 1, this.size[1]],
            [0, this.size[2], this.position]
        );
        this.ceiling.material = this.floorMaterial;
        this.scene.add(this.ceiling);


    }

    wall(size) {
        const material = new THREE.MeshBasicMaterial({color: 0xFF8844});

        const wallGeometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const wall = new THREE.Mesh(wallGeometry, material);
        return wall;
    }

    wallWithDoor(size) {
        const material = new THREE.MeshBasicMaterial({color: 0xFF8844});

        // Create the main wall as a Brush
        const wallGeometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const wallBrush = new Brush(wallGeometry);

        // Create the door geometry and apply transformations
        const doorWidth = 10;
        const doorHeight = 15;
        const doorDepth = size[2];
        const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);

        // Position the door within the wall
        doorGeometry.translate(0, -size[1] / 2 + doorHeight / 2, 0);

        const doorBrush = new Brush(doorGeometry);

        const evaluator = new Evaluator();
        let wallWithDoorMesh = evaluator.evaluate( wallBrush, doorBrush, SUBTRACTION );

        return wallWithDoorMesh;

    }
    createWallWithPhysics(size, position, rotationY = 0) {
        // Create the Three.js mesh
        const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const material = this.wallMaterial;
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position[0], position[1], position[2]);
        mesh.rotation.y = rotationY;
        //this.scene.add(mesh);

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
    createWallWithDoorPhysics(size, position, rotationY = 0) {
        // Create the Three.js mesh
        const material = this.wallMaterial;
        const wallGeometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const wallBrush = new Brush(wallGeometry);

        // Create the door geometry and apply transformations
        const doorWidth = 10;
        const doorHeight = 15;
        const doorDepth = size[2];
        const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);

        // Position the door within the wall
        doorGeometry.translate(0, -size[1] / 2 + doorHeight / 2, 0);

        const doorBrush = new Brush(doorGeometry);

        const evaluator = new Evaluator();
        let wallWithDoorMesh = evaluator.evaluate( wallBrush, doorBrush, SUBTRACTION);
        wallWithDoorMesh.position.set(position[0], position[1], position[2]);
        wallWithDoorMesh.rotation.y = rotationY;
        wallWithDoorMesh.material = material;
        this.scene.add(wallWithDoorMesh);

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

        return wallWithDoorMesh;
    }

    createFloorWithWoodShader(size, position, rotationY = 0) {
        // A) Create geometry
        const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);

        // B) Create a ShaderMaterial for the floor wood
        const woodShaderMaterial = new THREE.ShaderMaterial({
            vertexShader: woodVertexShader,
            fragmentShader: woodFragmentShader
            // no uniforms needed except if you wanted to animate
        });

        const mesh = new THREE.Mesh(geometry, woodShaderMaterial);
        mesh.position.set(position[0], position[1], position[2]);
        mesh.rotation.y = rotationY;

        // C) Physics: static rigid body
        const mass = 0;
        const shape = new this.physicsWorld.AmmoLib.btBoxShape(
            new this.physicsWorld.AmmoLib.btVector3(size[0]/2, size[1]/2, size[2]/2)
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



