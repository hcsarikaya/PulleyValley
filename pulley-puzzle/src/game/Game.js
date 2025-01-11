import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Player } from './Player.js';
import { LevelManager } from './LevelManager.js';
import { InteractionSystem } from "../controls/InteractionSystem.js"
import { CameraControls } from '../controls/CameraControls.js';
import InventoryUI from '../ui/InventoryUI.js';
import SoundManager from './SoundManager.js';

let scene, camera, renderer, controls, player, levelManager, interectionSystem, cameraControls, inventoryUI, soundManager;
let clock = new THREE.Clock();  // For deltaTime
let physicsWorld;
//let editMode = false;

import { PhysicsWorld } from '../objects/PhysicsWorld.js';


export async function initGame(level) {
    scene = new THREE.Scene();
    level = Number(level);

    physicsWorld = new PhysicsWorld();
    await physicsWorld.init(); //Wait for Ammo to load

    let roomSize = [80,50,45];
    let roomCenter =  [0,0,0];
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);


    inventoryUI = new InventoryUI('inventory-hotbar');
    soundManager = new SoundManager();

    soundManager.loadSounds();
    soundManager.playMusic();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    cameraControls = new CameraControls(camera, renderer, {
    });

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 10, 5);
    scene.add(pointLight);


    // Initialize and load the level
    levelManager = new LevelManager(scene, physicsWorld);
    levelManager.roomSize = roomSize;
    levelManager.loadLevel(level);

    

    // Create player
    player = new Player(scene,cameraControls.camera);


    interectionSystem = new InteractionSystem(scene, camera);
    interectionSystem.setPlayer(player.mesh);

    
    //tüm levellardaki objeleri eklemek için loop gerekli
    levelManager.levels[level - 1].objects.forEach((obj) => {
        if (obj.category === 'Pulley') {
            interectionSystem.addInteractiveObject(obj, {
                proximityThreshold: 15,
                promptText: 'Press "E" to colect',
                onInteract: (objMesh) => {
                    console.log('colecting...');
                    scene.remove(objMesh);
                }
            })
        }else if(obj.category === 'weight') {
            interectionSystem.addInteractiveObject(obj, {
                proximityThreshold: 15,
                promptText: 'Press "E" to colect',
                onInteract: (objMesh) => {
                    console.log('colecting...');
                    scene.remove(objMesh)
                }
            });
        }
        else if(obj.category === 'button') {
            switch (obj.opt){
                case "setting":
                    interectionSystem.addInteractiveObject(obj, {
                        proximityThreshold: 15,
                        promptText: 'Settings',
                        onInteract: (objMesh) => {
                            console.log('Settings...');
                            scene.remove(objMesh)
                        }
                    });
                case 1:
                    interectionSystem.addInteractiveObject(obj, {
                        proximityThreshold: 15,
                        promptText: 'Level 1',
                        onInteract: (objmesh) => {




                            levelManager.rooms[1].wallIn.position.y -=45

                            levelManager.checkLevel = true


                        }
                    });
                case 2:
                    interectionSystem.addInteractiveObject(obj, {
                        proximityThreshold: 15,
                        promptText: 'Level 2',
                        onInteract: (objMesh) => {
                            console.log('loading level ..');

                        }
                    });
                case 3:
                    interectionSystem.addInteractiveObject(obj, {
                        proximityThreshold: 15,
                        promptText: 'Level 3',
                        onInteract: (objMesh) => {
                            console.log('loading level ..');

                        }
                    });
            }

        }
    });

    interectionSystem.addInteractiveObject(levelManager.levels[level-1].doorOut, {
        proximityThreshold: 15,
        promptText: 'Press "E" to open door',
        onInteract: (doorMesh) => {
            console.log('Opening door...');
            // Add your door opening animation/logic here
            doorMesh.rotation.y += Math.PI / 2;
            level += 1
            roomCenter[2] -= roomSize[0];
            levelManager.loadLevel(level);
        }
    });






    animate();
}



function animate() {
    requestAnimationFrame(animate);
    player.update(); // Update player position
    interectionSystem.update();

    const delta = clock.getDelta();
    cameraControls.update(delta); // Update controls
    levelManager.update();
    physicsWorld.update(delta);

    levelManager.levels.forEach(lvl => {
        lvl.objects.forEach(obj => {
            if (obj.update) obj.update(); // e.g., rope has an update() method
        });
    });



    renderer.render(scene, camera);
}
