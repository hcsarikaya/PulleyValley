import * as THREE from 'three';

export class Weight {
    constructor(scene, position = { x: 5, y: 0.5, z: 5 }) {
        this.scene = scene;

        // Create the weight geometry
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);

        scene.add(this.mesh);
    }
}
