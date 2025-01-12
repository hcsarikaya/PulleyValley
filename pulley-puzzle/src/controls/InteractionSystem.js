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
        if(this.edit && this.objToCarry){
            this.objToCarry = null;
        }
    }
    onMouseDown(event){
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        console.log("df")
        const intersects = this.raycaster.intersectObjects(
            this.interactiveObjects.map(obj => obj.mesh || obj.model)
        );
        console.log(intersects);
        if (intersects.length > 0) {
            const clickedObject = this.interactiveObjects.find(
                obj => ( obj.model === intersects[0].object || obj.mesh === intersects[0].object)
            );
            console.log(clickedObject);
            if(this.edit){
                this.objToCarry = clickedObject;
                this.objToCarry.mesh.position.x = this.player.position.x;
                this.objToCarry.mesh.position.y = this.player.position.y + 6;
                this.objToCarry.mesh.position.z = this.player.position.z - 4;

                // Play the "pull" sound
                this.soundManager.playSound('pull');
            }

            if (clickedObject && clickedObject.isInRange) {
                this.showPrompt(clickedObject.promptText);
            }
        } else {
            this.hidePrompt();
        }
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
            if(this.edit){
                this.objToCarry = clickedObject;
                console.log(this.objToCarry.mesh.position)
                this.objToCarry.mesh.position.x = this.player.position.x;
                this.objToCarry.mesh.position.y = this.player.position.y;
                this.objToCarry.mesh.position.z = this.player.position.z;
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
            console.log(this.interactiveObjects)
            this.interactiveObjects.forEach(obj => {
                if (obj.isInRange) {
                    obj.onInteract(obj.mesh);
                    this.hidePrompt();
                }
            });
        }
        if (event.key.toLowerCase() === 'v') {
            console.log(this.interactiveObjects)
            if(this.edit){
                this.edit = false;
                this.hidePrompt();
            }else{
                this.edit = true;
            }
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
        this.objToCarry.mesh.position.x = this.player.position.x;
        this.objToCarry.mesh.position.y = this.player.position.y+6;
        this.objToCarry.mesh.position.z = this.player.position.z-4;
    }

    update() {
        if (!this.player) return;
        if(this.edit){
            this.showPrompt("Edit mode on");

        }
        if(this.objToCarry){

            this.carryObj();
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
