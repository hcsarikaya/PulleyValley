import * as THREE from 'three';

import { Door } from '../objects/Door.js';
import { Pulley } from '../objects/Pulley.js';
import { Rope } from '../objects/Rope.js';
import { Weight } from '../objects/Weight.js';

export function loadLevel1(scene) {
    // Add level-specific objects to the scene
    const loader = new THREE.TextureLoader();
    const wallTexture = loader.load('https://threejs.org/manual/examples/resources/images/wall.jpg');


    let wallMaterial = new THREE.MeshBasicMaterial({color: 0xFF8844 , map:wallTexture});


    const door = new Door(scene, { x: 0, y: 3, z: -15 });
    const pulley = new Pulley(scene, { x: 10, y: 5, z: 0 }, wallMaterial);
    const weight = new Weight(scene, { x: 5, y: 0.5, z: 5 });

    // Connect pulley and weight with a rope
    const rope = new Rope(scene);
    rope.attachTo(weight);
    rope.attachTo(pulley);
    rope.draw();
}
