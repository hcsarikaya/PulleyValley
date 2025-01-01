// Rope.js
import * as THREE from 'three';
import Ammo from 'ammo.js/ammo.js'
// Make sure to pass in the already-initialized physicsWorld from your code

export class Rope {
    constructor(scene, physicsWorld, startPos = [0, 10, 0], endPos = [0, 5, 0], segments = 10) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        const AmmoLib = this.physicsWorld.AmmoLib; // Already loaded in PhysicsWorld
        const softBodyHelpers = this.physicsWorld.softBodyHelpers;

        // Convert start/end to Ammo btVector3
        const startVec = new AmmoLib.btVector3(startPos[0], startPos[1], startPos[2]);
        const endVec   = new AmmoLib.btVector3(endPos[0],   endPos[1],   endPos[2]);

        // Create the rope soft body
        this.ropeSoftBody = softBodyHelpers.CreateRope(
            this.physicsWorld.physicsWorld.getWorldInfo(),
            startVec,
            endVec,
            segments,
            0 // fixed endpoints = 0 means both endpoints are fixed
        );

        // Set rope properties (tweak as needed)
        this.ropeSoftBody.get_m_materials().at(0).set_m_kLST(0.9); // linear stiffness
        this.ropeSoftBody.setTotalMass(1, false);
        this.ropeSoftBody.setCollisionFlags(0);

        // Add it to the physics world
        this.physicsWorld.physicsWorld.addSoftBody(this.ropeSoftBody, 1, -1);

        // Create a simple geometry in Three.js for visualization
        // We'll store the vertices as a line
        const ropeGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array((segments + 1) * 3); // segments+1 = number of rope nodes
        ropeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Simple line material
        const ropeMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        this.ropeMesh = new THREE.Line(ropeGeometry, ropeMaterial);

        scene.add(this.ropeMesh);
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
