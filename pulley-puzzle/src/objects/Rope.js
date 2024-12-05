import * as THREE from 'three';

export class Rope {
    constructor(scene) {
        this.scene = scene;
        this.ropePos = [];
        this.segments = []
        // Create the rope geometry
        //const geometry = new THREE.CylinderGeometry(0.1, 0.1, start.distanceTo(end));
        this.material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });

        //this.mesh = new THREE.Mesh(geometry, material);


        // Position the rope between the start and end
        /*
        const midpoint = start.clone().add(end).multiplyScalar(0.5);
        this.mesh.position.copy(midpoint);

        // Orient the rope to connect start and end
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        this.mesh.lookAt(end);
        this.mesh.rotateX(Math.PI / 2);

        scene.add(this.mesh);

         */
    }
    attachTo(object){
        this.ropePos.push(object.mesh.position);

    }
    draw(){
        if(this.ropePos.length >= 2){

            for (let i = 0; i < this.ropePos.length-1; i += 1) {
                console.log(this.ropePos[i]);
                const segmentGeo = new THREE.CylinderGeometry(0.1, 0.1, this.ropePos[i].distanceTo(this.ropePos[i+1]));
                const segMesh =new THREE.Mesh(segmentGeo, this.material);
                const midpoint = this.ropePos[i].clone().add(this.ropePos[i+1]).multiplyScalar(0.5);
                console.log(midpoint);
                segMesh.position.copy(midpoint);
                segMesh.lookAt(this.ropePos[i+1]);
                segMesh.rotateX(Math.PI / 2);
                this.scene.add(segMesh);
            }
        }
    }
}
