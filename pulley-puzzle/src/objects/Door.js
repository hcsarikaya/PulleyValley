import * as THREE from 'three';

export class Door {
    constructor(scene, position =  [0,  3, -10] ) {
        this.scene = scene;
        this.position = position;
        // Create the door geometry and material
        const geometry = new THREE.BoxGeometry(10, 15, 0.5);
        geometry.translate(0, -7.5, 0);
        const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position[0], position[1], position[2]);

        scene.add(this.mesh);

        this.isOpen = false;
    }

    open() {
        if (!this.isOpen) {
            this.isOpen = true;
            // Animate door opening by moving it upwards
            new THREE.Vector3(0, 6, 0); // Move upward
        }
    }
}
