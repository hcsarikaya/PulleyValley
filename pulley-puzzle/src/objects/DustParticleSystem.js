import * as THREE from 'three';

export class DustParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    spawnDust(position, count = 200) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        const posSpread = 3;
        const velSpread = 2;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            positions[i3 + 0] = position.x + (Math.random() - 0.5) * posSpread;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * posSpread;

            velocities.push(
                (Math.random() - 0.5) * velSpread, // vx
                Math.random() * velSpread,        // vy
                (Math.random() - 0.5) * velSpread // vz
            );
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x4F4431,
            size: 0.5,
            depthWrite: false,
            transparent: true,
            opacity: 0.8
        });

        const points = new THREE.Points(geometry, material);
        this.scene.add(points);

        this.particles.push({
            points,
            velocities,
            life: 5.0
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
                positions[j + 0] += burst.velocities[j + 0] * deltaTime; // x
                positions[j + 1] += burst.velocities[j + 1] * deltaTime; // y
                positions[j + 2] += burst.velocities[j + 2] * deltaTime; // z
            }
            burst.points.geometry.attributes.position.needsUpdate = true;

            const t = burst.life / 3.0; // Increase t (decrease float) => particles stay more
            burst.points.material.opacity = t * 0.8;
        }
    }
}
