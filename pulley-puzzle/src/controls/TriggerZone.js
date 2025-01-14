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
        this.onEnter = onEnter;
        this.triggeredObjects = new Set();

        // Create a simple visible box with no physics
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            visible: true,
            opacity: 0.5,
            transparent: true
        });
        
        // Create the mesh but don't add any physics properties
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        
        // Ensure the mesh doesn't interfere with physics
        this.mesh.matrixAutoUpdate = true;
        this.mesh.visible = true;
        this.mesh.renderOrder = 999; // Render on top
        
        scene.add(this.mesh);
    }

    checkIntersection(object) {
        if (object.userData && object.userData.type === 'weight') {
            const objectBox = new THREE.Box3().setFromObject(object);
            if (this.box.intersectsBox(objectBox)) {
                if (!this.triggeredObjects.has(object.uuid)) {
                    this.triggeredObjects.add(object.uuid);
                    if (this.onEnter) {
                        this.onEnter(object);
                    }
                }
            } else {
                this.triggeredObjects.delete(object.uuid);
            }
        }
    }
}
