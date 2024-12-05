import * as THREE from 'three';

export class Rope {
    constructor(scene, {
        startPoint = new THREE.Vector3(-10, 15, 0),
        endPoint = new THREE.Vector3(10, -15, 0),
        segmentCount = 20,
        segmentRadius = 0.05,
        ropeColor = 0x333333,
        stiffness = 0.5,
        damping = 0.99,
        gravity = new THREE.Vector3(0, -9.8, 0)
    } = {}) {
        this.scene = scene;
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.segmentCount = segmentCount;
        this.segmentRadius = segmentRadius;
        this.ropeColor = ropeColor;
        this.stiffness = stiffness;
        this.damping = damping;
        this.gravity = gravity;

        this.ropePoints = [];
        this.ropeVelocities = [];
        this.ropeMaterial = new THREE.LineBasicMaterial({
            color: this.ropeColor,
            linewidth: 3
        });

        // Rope segments for visual representation
        this.ropeSegments = [];

        this.attachedStartObject = null;
        this.attachedEndObject = null;

        this.init();
    }

    init() {
        const ropeLength = this.startPoint.distanceTo(this.endPoint);
        const segmentLength = ropeLength / this.segmentCount;

        // Initialize rope points and velocities
        for (let i = 0; i <= this.segmentCount; i++) {
            const t = i / this.segmentCount;
            const point = new THREE.Vector3().lerpVectors(this.startPoint, this.endPoint, t);

            this.ropePoints.push(point);
            this.ropeVelocities.push(new THREE.Vector3(0, 0, 0));

            // Create visual segments
            if (i < this.segmentCount) {
                const segmentGeometry = new THREE.CylinderGeometry(
                    this.segmentRadius,
                    this.segmentRadius,
                    segmentLength,
                    8
                );
                const segmentMaterial = new THREE.MeshPhongMaterial({ color: this.ropeColor });
                const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);

                // Rotate and position segments
                segment.rotation.x = Math.PI / 2;
                this.scene.add(segment);
                this.ropeSegments.push(segment);
            }
        }

        // Create rope line
        this.ropeGeometry = new THREE.BufferGeometry().setFromPoints(this.ropePoints);
        this.ropeLine = new THREE.Line(this.ropeGeometry, this.ropeMaterial);
        this.scene.add(this.ropeLine);
    }

    attachStart(object, localOffset = new THREE.Vector3(0, 0, 0)) {
        this.attachedStartObject = { object, localOffset };
        return this;
    }

    attachEnd(object, localOffset = new THREE.Vector3(0, 0, 0)) {
        this.attachedEndObject = { object, localOffset };
        return this;
    }

    update(deltaTime = 0.016) {
        // Update attachment points if objects are attached
        if (this.attachedStartObject) {
            const worldPos = this.attachedStartObject.object.localToWorld(
                this.attachedStartObject.localOffset.clone()
            );
            this.ropePoints[0].copy(worldPos);
        }

        if (this.attachedEndObject) {
            const worldPos = this.attachedEndObject.object.localToWorld(
                this.attachedEndObject.localOffset.clone()
            );
            this.ropePoints[this.segmentCount].copy(worldPos);
        }

        // Verlet integration
        for (let i = 1; i < this.segmentCount; i++) {
            const prev = this.ropePoints[i - 1];
            const curr = this.ropePoints[i];
            const next = this.ropePoints[i + 1];

            // Calculate ideal segment length
            const idealDistance = prev.distanceTo(next) / 2;

            // Constraint solving
            const diff1 = curr.distanceTo(prev) - idealDistance;
            const diff2 = curr.distanceTo(next) - idealDistance;

            const direction1 = new THREE.Vector3().subVectors(curr, prev).normalize();
            const direction2 = new THREE.Vector3().subVectors(curr, next).normalize();

            curr.add(direction1.multiplyScalar(diff1 * this.stiffness * 0.5));
            curr.add(direction2.multiplyScalar(diff2 * this.stiffness * 0.5));

            // Apply gravity and velocity
            const velocity = this.ropeVelocities[i];
            velocity.add(this.gravity.clone().multiplyScalar(deltaTime));
            curr.add(velocity);
            velocity.multiplyScalar(this.damping);
        }

        // Update rope geometry and segments
        this.updateRopeGeometry();
        this.updateRopeSegments();
    }

    updateRopeGeometry() {
        this.ropeGeometry.setFromPoints(this.ropePoints);
        this.ropeGeometry.attributes.position.needsUpdate = true;
    }

    updateRopeSegments() {
        for (let i = 0; i < this.segmentCount; i++) {
            // Position and orient rope segments between points
            const start = this.ropePoints[i];
            const end = this.ropePoints[i + 1];

            const segment = this.ropeSegments[i];

            // Calculate midpoint
            const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
            segment.position.copy(midpoint);

            // Calculate orientation
            const direction = new THREE.Vector3().subVectors(end, start).normalize();
            const up = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
            segment.quaternion.copy(quaternion);
        }
    }

    // Cleanup method to remove rope from scene
    dispose() {
        // Remove line
        if (this.ropeLine) {
            this.scene.remove(this.ropeLine);
            this.ropeGeometry.dispose();
            this.ropeMaterial.dispose();
        }

        // Remove segments
        this.ropeSegments.forEach(segment => {
            this.scene.remove(segment);
            segment.geometry.dispose();
            segment.material.dispose();
        });
    }
}

export default Rope;