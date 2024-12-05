import * as THREE from 'three';

export class Door {
    constructor(scene, position = { x: 0, y: 3, z: -10 }) {
        this.scene = scene;

        // Create the door geometry and material
        const geometry = new THREE.BoxGeometry(2, 6, 0.5);
        const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);

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
