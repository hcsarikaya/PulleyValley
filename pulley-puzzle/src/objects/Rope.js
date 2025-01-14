import * as THREE from 'three';

export class Rope {
    constructor(scene, physicsWorld, {
        startObject,
        endObject,
        segments = 20,
        ropeColor = 0x333333,
        stiffness = 0.5,
        damping = 0.99,
        gravity = new THREE.Vector3(0, -9.8, 0),
    }) {
        this.category = "rope"
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.startObject = startObject;
        this.endObject = endObject;
        this.segments = segments;
        this.ropeColor = ropeColor;
        this.stiffness = stiffness;
        this.damping = damping;
        this.gravity = gravity;

        this.ropePoints = [];
        this.ropeVelocities = [];
        this.ropeMaterial = new THREE.LineBasicMaterial({ color: this.ropeColor });

        this.init();
    }

    init() {
        const startPoint = this.getAttachmentPoint(this.startObject);
        const endPoint = this.getAttachmentPoint(this.endObject);

        const ropeLength = startPoint.distanceTo(endPoint);
        const segmentLength = ropeLength / this.segments;

        // Initialize rope points and velocities
        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            const point = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
            this.ropePoints.push(point);
            this.ropeVelocities.push(new THREE.Vector3(0, 0, 0));
        }

        // Create rope geometry and line
        this.ropeGeometry = new THREE.BufferGeometry().setFromPoints(this.ropePoints);
        this.ropeLine = new THREE.Line(this.ropeGeometry, this.ropeMaterial);
        this.scene.add(this.ropeLine);
    }

    getAttachmentPoint(object) {
        // Adjust based on whether object has a mesh or model
        if (object.mesh) return object.mesh.position;
        if (object.model) return object.model.position;
        return new THREE.Vector3(0, 0, 0);
    }

    calculateTension() {
        const startPoint = this.getAttachmentPoint(this.startObject);
        const endPoint = this.getAttachmentPoint(this.endObject);
        const distance = startPoint.distanceTo(endPoint);

        const naturalLength = this.ropePoints.length * (this.ropePoints[1].distanceTo(this.ropePoints[0]));
        const tensionForce = this.stiffness * (distance - naturalLength);

        return Math.max(tensionForce, 0); // Tension can't be negative
    }

    applyPhysics(deltaTime = 0.016) {
        for (let i = 1; i < this.ropePoints.length - 1; i++) {
            const prevPoint = this.ropePoints[i - 1];
            const nextPoint = this.ropePoints[i + 1];
            const currentPoint = this.ropePoints[i];
            const velocity = this.ropeVelocities[i];

            const directionPrev = new THREE.Vector3().subVectors(currentPoint, prevPoint).normalize();
            const directionNext = new THREE.Vector3().subVectors(currentPoint, nextPoint).normalize();

            const forcePrev = directionPrev.multiplyScalar(this.stiffness);
            const forceNext = directionNext.multiplyScalar(this.stiffness);

            const netForce = forcePrev.add(forceNext).add(this.gravity);
            velocity.add(netForce.multiplyScalar(deltaTime));
            velocity.multiplyScalar(this.damping);

            currentPoint.add(velocity.clone().multiplyScalar(deltaTime));
        }

        this.updateRopeGeometry();
    }

    update() {
        const startPoint = this.getAttachmentPoint(this.startObject);
        const endPoint = this.getAttachmentPoint(this.endObject);

        this.ropePoints[0].copy(startPoint);
        this.ropePoints[this.ropePoints.length - 1].copy(endPoint);

        this.applyPhysics();
    }

    updateRopeGeometry() {
        this.ropeGeometry.setFromPoints(this.ropePoints);
        this.ropeGeometry.attributes.position.needsUpdate = true;
    }

    dispose() {
        this.scene.remove(this.ropeLine);
        this.ropeGeometry.dispose();
        this.ropeMaterial.dispose();
    }
}
