import * as THREE from 'three';

export class TriggerZone {
    constructor(scene, position, size, onEnter) {
        this.scene = scene;
        this.box = new THREE.Box3(
            new THREE.Vector3(
                position.x - size.x / 2,
                position.y - size.y / 2,
                position.z - size.z / 2
            ),
            new THREE.Vector3(
                position.x + size.x / 2,
                position.y + size.y / 2,
                position.z + size.z / 2
            )
        );
        this.onEnter = onEnter; // Function to call when object enters the zone

        // Visualize the trigger zone (optional)
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            opacity: 0.5,
            transparent: true,
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        scene.add(this.mesh);
    }

    checkIntersection(object) {
        const objectBox = new THREE.Box3().setFromObject(object);
        if (this.box.intersectsBox(objectBox)) {
            this.onEnter(object);
        }
    }
}
