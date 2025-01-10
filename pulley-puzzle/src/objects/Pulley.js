import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Pulley {
    constructor(scene, position = [5, 5, 0], scale = 1) {
        this.scene = scene;
        this.model = null;

        const loader = new GLTFLoader();
        loader.load('../public/models/pulley.glb', (glb) => {
            this.model = glb.scene;

            // Set the initial position
            this.model.position.set(position[0], position[1], position[2]);

            // Set the initial scale
            this.model.scale.set(scale, scale, scale);

            // Add to the scene
            scene.add(this.model);
        }, undefined, (error) => {
            console.error('An error occurred while loading the pulley model:', error);
        });
    }

    setScale(scale) {
        if (this.model) {
            this.model.scale.set(scale, scale, scale);
        } else {
            console.warn('Pulley model is not loaded yet. Scale cannot be set.');
        }
    }

    rotate(amount) {
        if (this.model) {
            this.model.rotation.z += amount;
        }
    }
}
