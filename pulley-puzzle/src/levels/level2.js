import * as THREE from 'three';

import { Door } from '../objects/Door.js';
import { Pulley } from '../objects/Pulley.js';
import { Rope} from '../objects/Wire.js';
import { Weight } from '../objects/Weight.js';
export function loadLevel2(scene) {
    const door = new Door(scene, { x: 0, y: 3, z: -15 });
    const pulley = new Pulley(scene, { x: 5, y: 5, z: 0 });
    const weight = new Weight(scene, { x: 5, y: 0.5, z: 5 });
    console.log(weight.mesh.position.x, weight.mesh.position.y, weight.mesh.position.z);
    // Connect pulley and weight with a rope

    const rope = new Rope(scene)
        .attachStart(pulley)  // Attach to start object
        .attachEnd(weight);
}