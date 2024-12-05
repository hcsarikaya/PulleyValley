import * as THREE from 'three'; // Import THREE.js

export function createPulleySystem(scene) {
    const pulleyGeometry = new THREE.TorusGeometry(1, 0.1, 16, 100);
    const pulleyMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const pulleyMesh = new THREE.Mesh(pulleyGeometry, pulleyMaterial);
    pulleyMesh.rotation.x = Math.PI / 2;
    pulleyMesh.position.set(0, 4, 0);
    scene.add(pulleyMesh);

    const ropeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 6, 32);
    const ropeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const ropeMesh = new THREE.Mesh(ropeGeometry, ropeMaterial);
    ropeMesh.position.set(0, 1, 0);
    scene.add(ropeMesh);

    const weightGeometry = new THREE.BoxGeometry(1, 1, 1);
    const weightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const weightMesh = new THREE.Mesh(weightGeometry, weightMaterial);
    weightMesh.position.set(0, -2, 0);
    scene.add(weightMesh);

    window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp') movePulley(pulleyMesh, ropeMesh, weightMesh, 1);
        if (event.key === 'ArrowDown') movePulley(pulleyMesh, ropeMesh, weightMesh, -1);
    });
}

function movePulley(pulleyMesh, ropeMesh, weightMesh, direction) {
    const speed = 0.05;
    pulleyMesh.rotation.z += direction * speed;
    ropeMesh.scale.y -= direction * 0.02;
    weightMesh.position.y -= direction * 0.1;
}
