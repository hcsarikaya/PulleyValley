import * as THREE from 'three';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { woodVertexShader, woodFragmentShader } from '../shaders/WoodShader.js';

export class Room {
    constructor(scene, size, physicsWorld){
        this.size = size;
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        const loader = new THREE.TextureLoader();

        const wallTexture = loader.load('/src/textures/MossyBrick.jpg');
        wallTexture.colorSpace = THREE.SRGBColorSpace;
        wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(5, 2);

        // Use a material that reacts to light
        this.wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x787171,
            map: wallTexture,
            roughness: 0.7,
            metalness: 0.1
        });

        const floorTexture = loader.load('/src/textures/MossyBrick.jpg');
        floorTexture.colorSpace = THREE.SRGBColorSpace;
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(5, 5);

        // Floor material
        this.floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x787171,
            map: floorTexture,
            roughness: 0.8,
            metalness: 0.1
        });
    }

    createRoom(position) {
        this.position = position || 0;

        // Example usage
        this.wallIn = this.createWallWithDoorPhysics(
            [this.size[0], this.size[2], 1],
            [0, this.size[2]/2, this.size[1]/2 + this.position]
        );
        this.wallOut = this.createWallWithDoorPhysics(
            [this.size[0], this.size[2], 1],
            [0, this.size[2]/2, -this.size[1]/2 + this.position]
        );
        this.wallL = this.createWallWithPhysics(
            [this.size[1], this.size[2], 1],
            [-this.size[0]/2, this.size[2]/2, this.position],
            Math.PI / 2
        );
        this.scene.add(this.wallL);
        this.wallR = this.createWallWithPhysics(
            [this.size[1], this.size[2], 1],
            [this.size[0]/2, this.size[2]/2, this.position],
            Math.PI / 2
        );
        this.scene.add(this.wallR);

        // Floor
        this.floor = this.createFloorWithWoodShader(
            [this.size[0], 1, this.size[1]],
            [0, -0.5, this.position]
        );
        this.scene.add(this.floor);

        // Ceiling
        this.ceiling = this.createWallWithPhysics(
            [this.size[0], 1, this.size[1]],
            [0, this.size[2], this.position]
        );
        this.ceiling.material = this.floorMaterial;
        this.scene.add(this.ceiling);
    }

    createWallWithPhysics(size, position, rotationY = 0) {
        const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const mesh = new THREE.Mesh(geometry, this.wallMaterial);

        // Enable shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.position.set(position[0], position[1], position[2]);
        mesh.rotation.y = rotationY;

        // Create static body in Ammo
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

    createWallWithDoorPhysics(size, position, rotationY = 0) {
        const wallGeometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const wallBrush = new Brush(wallGeometry);

        // Door geometry
        const doorWidth = 10;
        const doorHeight = 15;
        const doorDepth = size[2];
        const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        doorGeometry.translate(0, -size[1]/2 + doorHeight/2, 0);

        const doorBrush = new Brush(doorGeometry);
        const evaluator = new Evaluator();
        let wallWithDoorMesh = evaluator.evaluate(wallBrush, doorBrush, SUBTRACTION);

        wallWithDoorMesh.material = this.wallMaterial;

        // shadows
        wallWithDoorMesh.castShadow = true;
        wallWithDoorMesh.receiveShadow = true;

        wallWithDoorMesh.position.set(position[0], position[1], position[2]);
        wallWithDoorMesh.rotation.y = rotationY;
        this.scene.add(wallWithDoorMesh);

        // Physics
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

        return wallWithDoorMesh;
    }

    createFloorWithWoodShader(size, position, rotationY = 0) {
        const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);

        // Create shader material with lighting uniforms
        const woodShaderMaterial = new THREE.ShaderMaterial({
            vertexShader: woodVertexShader,
            fragmentShader: woodFragmentShader,
            uniforms: {
                spotLights: { 
                    value: [
                        {
                            position: new THREE.Vector3(0, 40, 0),
                            direction: new THREE.Vector3(0, -1, 0),
                            color: new THREE.Color(0xffffff),
                            distance: 200,
                            decay: 0.2,
                            coneCos: Math.cos(Math.PI / 2.5),
                            penumbraCos: Math.cos(Math.PI / 2.5 + 0.1),
                            intensity: 10.0,
                            visible: true
                        },
                        {
                            position: new THREE.Vector3(0, 40, -45),
                            direction: new THREE.Vector3(0, -1, 0),
                            color: new THREE.Color(0xffffff),
                            distance: 200,
                            decay: 0.2,
                            coneCos: Math.cos(Math.PI / 2.5),
                            penumbraCos: Math.cos(Math.PI / 2.5 + 0.1),
                            intensity: 10.0,
                            visible: true
                        }
                    ]
                }
            }
        });

        const mesh = new THREE.Mesh(geometry, woodShaderMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.position.set(position[0], position[1], position[2]);
        mesh.rotation.y = rotationY;

        // Store material reference for updates
        mesh.userData.woodShaderMaterial = woodShaderMaterial;

        // Physics
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
