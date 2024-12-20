import * as THREE from 'three';

import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';

export class Room{
    constructor(scene){
        this.scene = scene;
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

        this.wallIn = this.wallWithDoor([50, 30, 1])
        this.wallIn.position.set(0, 15, 25+this.position);
        this.wallIn.material = this.wallMaterial;
        this.scene.add(this.wallIn);

        this.wallOut = this.wallWithDoor([50, 30, 1])
        this.wallOut.position.set(0, 15, -25+this.position);
        this.wallOut.material = this.wallMaterial;
        this.scene.add(this.wallOut);

        this.wallL = this.wall([50, 30, 1])
        this.wallL.position.set(-25, 15, 0+this.position);
        this.wallL.rotation.y = Math.PI / 2;
        this.wallL.material = this.wallMaterial;
        this.scene.add(this.wallL);

        this.wallR = this.wall([50, 30, 1])
        this.wallR.position.set(25, 15, 0+this.position);
        this.wallR.rotation.y = Math.PI / 2;
        this.wallR.material = this.wallMaterial;
        this.scene.add(this.wallR);

        this.floor = this.wall([50, 1, 50]);
        this.floor.material = this.floorMaterial;
        this.floor.position.y = -0.5;
        this.floor.position.z = this.position;
        this.scene.add(this.floor);

        this.ceiling = this.wall([50, 1, 50]);
        this.ceiling.material = this.floorMaterial;
        this.ceiling.position.y = 30;
        this.ceiling.position.z = this.position;
        this.scene.add(this.ceiling);

        // Add basic lighting to the scene
        const light = new THREE.PointLight(0xffffff, 1);
        light.position.set(0, 10, 10); // Position the light in the scene
        this.scene.add(light);

// Optional: Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft light
        this.scene.add(ambientLight);
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
        const wallWithDoorMesh = evaluator.evaluate( wallBrush, doorBrush, SUBTRACTION );

        return wallWithDoorMesh;

    }
}
/*
export function createRoom(scene) {
    const loader = new THREE.TextureLoader();

    const wallTexture = loader.load('https://threejs.org/manual/examples/resources/images/wall.jpg');
    const floorTexture = loader.load('https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/6176f303-518c-4b9f-a201-b6fe1b4239b2/d6xlhqd-f35f4ff4-2fb0-4396-8640-ccb1ab5ac076.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzYxNzZmMzAzLTUxOGMtNGI5Zi1hMjAxLWI2ZmUxYjQyMzliMlwvZDZ4bGhxZC1mMzVmNGZmNC0yZmIwLTQzOTYtODY0MC1jY2IxYWI1YWMwNzYucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Jd-8zva1jG355B9yMCWHRKGI50mKb-tcCVIIX-FMPlI');
    wallTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.colorSpace = THREE.SRGBColorSpace;

    // Repeat and wrap textures for better appearance
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(5, 2); // Adjust based on your texture size
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(5, 5);

    // Floor
    const floorGeometry = new THREE.BoxGeometry(50, 1, 50);
    const floorMaterial = new THREE.MeshBasicMaterial({color: 0xFF8844, map: floorTexture });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    scene.add(floor);

    // Walls
    const wallGeometry = new THREE.BoxGeometry(50, 30, 1);
    const wallMaterial = new THREE.MeshBasicMaterial({color: 0xFF8844, map: wallTexture });

    // Back Wall
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 15, -25);
    scene.add(backWall);

    // Front Wall
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.set(0, 15, 25);
    scene.add(frontWall);

    // Left Wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-25, 15, 0);
    scene.add(leftWall);

    // Right Wall
    //const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    const rightWall = wallWithDoor([50, 30, 1]);
    rightWall.material = wallMaterial;
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(25, 15, 0);
    scene.add(rightWall);

    // Optional: Add a simple ceiling
    const ceilingGeometry = new THREE.BoxGeometry(50, 1, 50);
    const ceilingMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const ceiling = wall([50, 1, 50]);

    ceiling.position.y = 30;
    scene.add(ceiling);

    // Add basic lighting to the scene
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(0, 10, 10); // Position the light in the scene
    scene.add(light);

// Optional: Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft light
    scene.add(ambientLight);
}

function wall(size, url) {
    let material;
    if(url){
        const loader = new THREE.TextureLoader();
        const texture = loader.load(url);
        const material = new THREE.MeshBasicMaterial({color: 0xFF8844, map: texture });
    }else{
        const material = new THREE.MeshBasicMaterial({ color: 0x333333 });
    }

    const wallGeometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const wall = new THREE.Mesh(wallGeometry, material);
    return wall;
}
function wallWithDoor(size, url) {
    const loader = new THREE.TextureLoader();
    const texture = url ? loader.load(url) : null;

    const material = new THREE.MeshBasicMaterial({
        color: 0xFF8844,
        map: texture,
    });

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
    const wallWithDoorMesh = evaluator.evaluate( wallBrush, doorBrush, SUBTRACTION );

    return wallWithDoorMesh;




}

 */


