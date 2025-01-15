import * as THREE from 'three';

export class Rope {
    constructor(scene, {
        startPosition = new THREE.Vector3(),
        endPosition = new THREE.Vector3(),
        segments = 20,
        ropeColor = 0x333333,
        type = 'static'
    }) {
        this.category = "rope";
        this.scene = scene;
        this.startPosition = startPosition.clone();
        this.endPosition = endPosition.clone();
        this.initialStartY = startPosition.y;
        this.initialEndY = endPosition.y;
        this.segments = segments;
        this.ropeColor = ropeColor;
        this.type = type;

        this.ropePoints = [];
        this.ropeVelocities = [];
        this.ropeMaterial = new THREE.LineBasicMaterial({ color: this.ropeColor });

        this.init();
    }

    init() {
        if (!this.isValidVector(this.startPosition) || !this.isValidVector(this.endPosition)) {
            console.error('Invalid start or end position:', this.startPosition, this.endPosition);
            return;
        }

        this.startPosition.y += 2;
        this.endPosition.y += 2;

        this.ropePoints = [];
        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            const point = new THREE.Vector3();
            point.lerpVectors(this.startPosition, this.endPosition, t);

            if (!this.isValidVector(point)) {
                console.error('Invalid point generated:', point, 't:', t);
                continue;
            }

            this.ropePoints.push(point);
            this.ropeVelocities.push(new THREE.Vector3(0, 0, 0));
        }

        if (this.ropePoints.length > 0) {
            this.ropeGeometry = new THREE.BufferGeometry().setFromPoints(this.ropePoints);
            this.ropeLine = new THREE.Line(this.ropeGeometry, this.ropeMaterial);
            this.scene.add(this.ropeLine);
        }
    }

    isValidVector(vector) {
        return vector &&
               !isNaN(vector.x) &&
               !isNaN(vector.y) &&
               !isNaN(vector.z) &&
               isFinite(vector.x) &&
               isFinite(vector.y) &&
               isFinite(vector.z);
    }

    update(palletY, boulderY) {
        if (!this.ropeGeometry || !this.ropePoints.length) return;
        if (this.type === 'static') return;

        if (isNaN(palletY) || isNaN(boulderY)) {
            //console.error('Invalid Y values:', palletY, boulderY);
            return;
        }

        if (this.type === 'dropping') {
            this.endPosition.y = palletY + 2;
        } else if (this.type === 'lifting') {
            const heightDifference = boulderY - this.initialEndY;
            //this.startPosition.y = this.initialStartY + heightDifference;
            this.endPosition.y = this.initialEndY + heightDifference;
        }

        if (!this.isValidVector(this.startPosition) || !this.isValidVector(this.endPosition)) {
            console.error('Invalid positions after update:', this.startPosition, this.endPosition);
            return;
        }

        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            if (!this.ropePoints[i]) {
                this.ropePoints[i] = new THREE.Vector3();
            }
            this.ropePoints[i].lerpVectors(this.startPosition, this.endPosition, t);

            if (!this.isValidVector(this.ropePoints[i])) {
                console.error('Invalid point during update:', i, this.ropePoints[i]);
                return;
            }
        }

        try {
            this.ropeGeometry.setFromPoints(this.ropePoints);
        } catch (error) {
            console.error('Error updating rope geometry:', error);
        }
    }

    dispose() {
        if (this.ropeLine) {
            this.scene.remove(this.ropeLine);
        }
        if (this.ropeGeometry) {
            this.ropeGeometry.dispose();
        }
        if (this.ropeMaterial) {
            this.ropeMaterial.dispose();
        }
    }
}
