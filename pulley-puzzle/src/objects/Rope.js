import * as THREE from 'three';
import Ammo from 'ammo.js/ammo.js'

export class Rope {
    constructor(scene,physicsWorld, startObj = [0, 10, 0], endObj = [0, 5, 0], segments = 10) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.category = 'rope';

        if(startObj.mesh && endObj.mesh){
            this.startPos = [startObj.mesh.position.x, startObj.mesh.position.y, startObj.mesh.position.z];
            this.endPos = [endObj.mesh.position.x, endObj.mesh.position.y, endObj.mesh.position.z];
        }

        if(startObj.model && endObj.model){
            this.startPos = [startObj.model.position.x, startObj.model.position.y, startObj.model.position.z];
            this.endPos = [endObj.model.position.x, endObj.model.position.y, endObj.model.position.z];
        }

        const AmmoLib = this.physicsWorld.AmmoLib; // Already loaded in PhysicsWorld
        const softBodyHelpers = this.physicsWorld.softBodyHelpers;

        // Convert start/end to Ammo btVector3
        const startVec = new AmmoLib.btVector3(this.startPos[0], this.startPos[1], this.startPos[2]);
        const endVec   = new AmmoLib.btVector3(this.endPos[0],   this.endPos[1],   this.endPos[2]);

        // Create the rope soft body
        this.ropeSoftBody = softBodyHelpers.CreateRope(
            this.physicsWorld.physicsWorld.getWorldInfo(),
            startVec,
            endVec,
            segments,
            0 // fixed endpoints = 0 means both endpoints are fixed
        );

        // Set rope properties (tweak as needed)
        this.ropeSoftBody.get_m_materials().at(0).set_m_kLST(1.0); // linear stiffness
        this.ropeSoftBody.setTotalMass(1, false);
        this.ropeSoftBody.setCollisionFlags(0.99);

        // Add it to the physics world
        this.physicsWorld.physicsWorld.addSoftBody(this.ropeSoftBody, 1, -1);

        // Create a simple geometry in Three.js for visualization
        // We'll store the vertices as a line
        const ropeGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array((segments + 1) * 3); // segments+1 = number of rope nodes
        ropeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Simple line material
        const ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8e4d1e });
        this.ropeMesh = new THREE.Line(ropeGeometry, ropeMaterial);

        scene.add(this.ropeMesh);
        this.ropeSoftBody.appendAnchor( 0, startObj.mesh.userData.physicsBody, true, 1 )
        this.ropeSoftBody.appendAnchor( 10, endObj.mesh.userData.physicsBody, true, 1 )
    }

    update() {
        // Update the Three.js rope geometry based on Ammo soft body nodes
        const AmmoLib = this.physicsWorld.AmmoLib;
        const positions = this.ropeMesh.geometry.attributes.position.array;
        const numNodes = this.ropeSoftBody.get_m_nodes().size();

        for (let i = 0; i < numNodes; i++) {
            const node = this.ropeSoftBody.get_m_nodes().at(i);
            const nodePos = node.get_m_x();
            const x = nodePos.x();
            const y = nodePos.y();
            const z = nodePos.z();
            positions[3 * i]     = x;
            positions[3 * i + 1] = y;
            positions[3 * i + 2] = z;
        }

        this.ropeMesh.geometry.attributes.position.needsUpdate = true;
        this.ropeMesh.geometry.computeBoundingSphere();
    }
}
