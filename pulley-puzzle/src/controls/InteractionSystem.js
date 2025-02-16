import * as THREE from 'three';
import SoundManager from "../game/SoundManager.js";

export class InteractionSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.player = null;
        this.interactiveObjects = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.edit = false;
        this.objToCarry = null;
        this.soundManager = new SoundManager();

        // Create HTML element for interaction prompt
        this.promptElement = document.createElement('div');
        this.promptElement.style.position = 'absolute';
        this.promptElement.style.padding = '10px';
        this.promptElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.promptElement.style.color = 'white';
        this.promptElement.style.fontFamily = 'Arial, sans-serif';
        this.promptElement.style.fontSize = '16px';
        this.promptElement.style.display = 'none';
        this.promptElement.style.left = '50%';
        this.promptElement.style.bottom = '10px';
        this.promptElement.style.transform = 'translateX(-50%)';
        this.promptElement.style.borderRadius = '8px';
        this.promptElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        document.body.appendChild(this.promptElement);

        // Bind event listeners
        this.setupEventListeners();
    }

    setPlayer(player) {
        this.player = player;
    }

    setupEventListeners() {
        //window.addEventListener('click', (e) => this.onMouseClick(e));
        window.addEventListener('keydown', (e) => this.onKeyPress(e));
        window.addEventListener("mousedown", (e) => this.onMouseDown(e));

        window.addEventListener("mouseup", (e) => this.onMouseUp(e));
    }

    addInteractiveObject(object ) {

        this.interactiveObjects.push(object);
    }
    onMouseUp(event){
        if(this.edit && this.objToCarry) {
            if(this.objToCarry.category === "weight") {
                // Check position when dropping the weight
                this.objToCarry.checkPosition(this.objToCarry.model.position);
            }
            this.objToCarry = null;
        }
    }
    onMouseDown(event){
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(
            this.interactiveObjects.map(obj => obj.mesh || obj.model), true
        );

        if (intersects.length > 0) {
            const clickedObject = this.interactiveObjects.find(
                obj => (obj.model === intersects[0].object || obj.model === intersects[0].object.parent || obj.mesh === intersects[0].object)
            );
            console.log(clickedObject);
            if(this.edit){
                // Check if the object is movable (has a moveTo function)
                if(clickedObject && typeof clickedObject.moveTo === 'function') {
                    this.objToCarry = clickedObject;
                    this.objToCarry.moveTo(this.camera, 3);
                    // Play the "pull" sound
                    this.soundManager.playSound('pull');
                }
            }

            if (clickedObject && clickedObject.isInRange) {
                this.showPrompt(clickedObject.promptText);
            }
        } else {
            this.hidePrompt();
        }
    }


    onKeyPress(event) {
        if (event.key.toLowerCase() === 'e') {
            console.log(this.interactiveObjects);
        }
        if (event.key.toLowerCase() === 'v') {
            if(this.edit){
                this.edit = false;
                this.hidePrompt();
            }else{
                this.edit = true;
            }
        }
        // Add level change controls with U, I, O keys
        if (event.key.toLowerCase() === 'u') {
            window.currentLevel = 1;
            console.log('Switched to Room 1');
        }
        if (event.key.toLowerCase() === 'i') {
            window.currentLevel = 2;
            console.log('Switched to Room 2');
        }
        if (event.key.toLowerCase() === 'o') {
            window.currentLevel = 3;
            console.log('Switched to Room 3');
        }
    }

    showPrompt(text) {
        this.promptElement.textContent = text;
        this.promptElement.style.display = 'block';
    }

    hidePrompt() {
        this.promptElement.style.display = 'none';
    }
    carryObj(){
        this.objToCarry.moveTo(this.camera, 3);
    }

    update() {
        if (!this.player) return;
        if(this.edit){
            this.showPrompt("Edit mode on");

        }
        if(this.objToCarry){

            this.carryObj();
            //this.objToCarry.update()
        }
        /*
        this.interactiveObjects.forEach(obj => {
            const target = obj.mesh;
            //const distance = this.player.position.distanceTo(target.mesh.position || target.model.position);

            //obj.isInRange = distance < obj.proximityThreshold;
        });

         */
    }
}
