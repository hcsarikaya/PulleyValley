import * as THREE from 'three';

export class Button {
    constructor(scene, position = [ 5,  0.5,  5 ], opt) {
        this.scene = scene;
        this.category = 'button';
        this.opt = opt;
        const geometry = new THREE.BoxGeometry(4, 1, 4);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 30
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position[0], position[1], position[2]);
        
        // Enable shadows
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        scene.add(this.mesh);
    }
}
