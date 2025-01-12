import * as THREE from 'three';

export class WizardParticleSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.particles = [];
        this.isSpawning = false;
        this.spawnInterval = null;
        this.setupMouseControls();
    }

    setupMouseControls() {
        document.addEventListener('mousedown', () => {
            this.isSpawning = true;
            this.startSpawning();
        });

        document.addEventListener('mouseup', () => {
            this.isSpawning = false;
            if (this.spawnInterval) {
                clearInterval(this.spawnInterval);
                this.spawnInterval = null;
            }
        });
    }

    startSpawning() {
        // Spawn initial burst
        this.spawnParticles();

        // Continue spawning while mouse is held
        this.spawnInterval = setInterval(() => {
            if (this.isSpawning) {
                this.spawnParticles();
            }
        }, 20); // Spawn every 100ms
    }

    spawnParticles(count = 50) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        // Get camera direction
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);

        // Get spawn position slightly in front of camera
        const spawnPosition = new THREE.Vector3();
        this.camera.getWorldPosition(spawnPosition);
        spawnPosition.add(cameraDirection.multiplyScalar(5)); // Spawn 5 units in front of camera

        const posSpread = 1;
        const velBase = 5; // Base velocity in camera direction
        const velSpread = 2;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Position particles in a small spread around spawn point
            positions[i3 + 0] = spawnPosition.x + (Math.random() - 0.5) * posSpread;
            positions[i3 + 1] = spawnPosition.y + (Math.random() - 0.5) * posSpread;
            positions[i3 + 2] = spawnPosition.z + (Math.random() - 0.5) * posSpread;

            // Calculate velocity with base direction plus spread
            const vel = new THREE.Vector3(
                cameraDirection.x * velBase + (Math.random() - 0.5) * velSpread,
                cameraDirection.y * velBase + (Math.random() - 0.5) * velSpread,
                cameraDirection.z * velBase + (Math.random() - 0.5) * velSpread
            );

            velocities.push(vel.x, vel.y, vel.z);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x84d3e3, // Green particles, change color as needed
            size: 0.2,
            depthWrite: false,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(geometry, material);
        this.scene.add(points);

        this.particles.push({
            points,
            velocities,
            life: 3.0 // Shorter life for faster particle turnover
        });
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const burst = this.particles[i];
            burst.life -= deltaTime;

            if (burst.life <= 0) {
                this.scene.remove(burst.points);
                this.particles.splice(i, 1);
                continue;
            }

            const positions = burst.points.geometry.attributes.position.array;
            for (let j = 0; j < burst.velocities.length; j += 3) {
                positions[j + 0] += burst.velocities[j + 0] * deltaTime;
                positions[j + 1] += burst.velocities[j + 1] * deltaTime;
                positions[j + 2] += burst.velocities[j + 2] * deltaTime;
            }
            burst.points.geometry.attributes.position.needsUpdate = true;

            const t = burst.life / 2.0;
            burst.points.material.opacity = t * 0.8;
        }
    }
}