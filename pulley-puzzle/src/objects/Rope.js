import * as THREE from 'three';

export class Rope {
    constructor(scene, {
        startPosition = new THREE.Vector3(),
        endPosition = new THREE.Vector3(),
        segments = 20,
        ropeColor = 0x333333,
    }) {
        this.category = "rope";
        this.scene = scene;
        this.startPosition = startPosition;
        this.endPosition = endPosition;
        this.segments = segments;
        this.ropeColor = ropeColor;

        this.ropePoints = [];
        this.ropeMaterial = new THREE.LineBasicMaterial({ color: this.ropeColor });

        this.init();
    }

    init() {
        this.startPosition.y += 2
        this.endPosition.y += 2
        // Initialize rope points
        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            const point = new THREE.Vector3().lerpVectors(this.startPosition, this.endPosition, t);
            this.ropePoints.push(point);
        }

        // Create rope geometry and line
        this.ropeGeometry = new THREE.BufferGeometry().setFromPoints(this.ropePoints);
        this.ropeLine = new THREE.Line(this.ropeGeometry, this.ropeMaterial);
        this.scene.add(this.ropeLine);
    }
    /*
    update(startPosition, endPosition) {
        // Update start and end positions
        this.startPosition.copy(startPosition);
        this.endPosition.copy(endPosition);

        // Update rope points
        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            this.ropePoints[i].lerpVectors(this.startPosition, this.endPosition, t);
        }

        // Update geometry
        this.ropeGeometry.setFromPoints(this.ropePoints);
    }

     */

    dispose() {
        this.scene.remove(this.ropeLine);
        this.ropeGeometry.dispose();
        this.ropeMaterial.dispose();
    }
}
