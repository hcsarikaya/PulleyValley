import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Pulley {
    constructor(scene, position = { x: 5, y: 5, z: 0 }, material) {

        this.scene = scene;
        this.model;
        const loader = new GLTFLoader();
        loader.load( '../public/models/pulley.glb', function ( glb ) {
            console.log( "fdsadf" );
            this.model = glb.scene;
            this.model.position.set(10,10,0);
            scene.add(this.model);

            } );



            if (material) {
            this.material = material;
        }else{
            this.material = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        }
        // Create the pulley geometry
        const geometry = new THREE.CylinderGeometry(2, 2, 0.5, 32);

        this.mesh = new THREE.Mesh(geometry, this.material);

        this.mesh.position.set(position.x, position.y, position.z);
        this.mesh.rotation.x = Math.PI / 2;
        scene.add(this.mesh);
    }

    rotate(amount) {
        this.mesh.rotation.z += amount;
    }
}
