import * as THREE from 'three';

export class Button {
    constructor(scene, position = [ 5,  0.5,  5 ], opt) {
        this.scene = scene;
        this.category = 'button';
        this.opt = opt;
        const geometry = new THREE.BoxGeometry(4, 1, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position[0], position[1], position[2]);

        scene.add(this.mesh);
    }
}
