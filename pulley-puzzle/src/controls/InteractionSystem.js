import * as THREE from 'three';
export class InteractionSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.player = null;
        this.interactiveObjects = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Create HTML element for interaction prompt
        this.promptElement = document.createElement('div');
        this.promptElement.style.position = 'absolute';
        this.promptElement.style.padding = '10px';
        this.promptElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.promptElement.style.color = 'white';
        this.promptElement.style.fontFamily = 'Arial';
        this.promptElement.style.fontSize = '16px';
        this.promptElement.style.display = 'none';
        this.promptElement.style.top = '50%';
        this.promptElement.style.left = '50%';
        this.promptElement.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(this.promptElement);

        // Bind event listeners
        this.setupEventListeners();
    }

    setPlayer(player) {
        this.player = player;
    }

    setupEventListeners() {
        window.addEventListener('click', (e) => this.onMouseClick(e));
        window.addEventListener('keydown', (e) => this.onKeyPress(e));
    }

    addInteractiveObject(object, options = {}) {
        const interactiveObject = {
            mesh: object.mesh,
            proximityThreshold: options.proximityThreshold || 5,
            promptText: options.promptText || 'Press "E" to interact',
            onInteract: options.onInteract || (() => {}),
            isInRange: false
        };
        this.interactiveObjects.push(interactiveObject);
    }

    onMouseClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            this.interactiveObjects.map(obj => obj.mesh)
        );

        if (intersects.length > 0) {
            const clickedObject = this.interactiveObjects.find(
                obj => obj.mesh === intersects[0].object
            );

            if (clickedObject && clickedObject.isInRange) {
                this.showPrompt(clickedObject.promptText);
            }
        } else {
            this.hidePrompt();
        }
    }

    onKeyPress(event) {
        if (event.key.toLowerCase() === 'e') {
            this.interactiveObjects.forEach(obj => {
                if (obj.isInRange) {
                    obj.onInteract(obj.mesh);
                    this.hidePrompt();
                }
            });
        }
    }

    showPrompt(text) {
        this.promptElement.textContent = text;
        this.promptElement.style.display = 'block';
    }

    hidePrompt() {
        this.promptElement.style.display = 'none';
    }

    update() {
        if (!this.player) return;

        this.interactiveObjects.forEach(obj => {
            const distance = this.player.position.distanceTo(obj.mesh.position);

            obj.isInRange = distance < obj.proximityThreshold;
        });
    }
}
