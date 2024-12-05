import * as THREE from 'three';

export function createRoom(scene) {
    const loader = new THREE.TextureLoader();

    // Load JPG textures
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
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(25, 15, 0);
    scene.add(rightWall);

    // Optional: Add a simple ceiling
    const ceilingGeometry = new THREE.BoxGeometry(50, 1, 50);
    const ceilingMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
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
