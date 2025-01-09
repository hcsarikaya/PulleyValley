import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Player } from './Player.js';
import { LevelManager } from './LevelManager.js';
import { InteractionSystem } from "../controls/InteractionSystem.js"
import { CameraControls } from '../controls/CameraControls.js';

let scene, camera, renderer, controls, player, levelManager, interectionSystem, cameraControls;


export function initGame(level) {
    scene = new THREE.Scene();
    level = Number(level);
    console.log("level", level);
    let roomSize = [50,50,30];
    let roomCenter =  [0,0,0];
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    //camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    cameraControls = new CameraControls(camera, renderer, {
        freeMoveSpeed: 0.3,
        mouseSensitivity: 0.0025
        //TODO room size eklenecek
    });

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;  // Minimum zoom distance
    controls.maxDistance = 20; // Maximum zoom distance
    controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below the floor

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 10, 5);
    scene.add(pointLight);




    // Initialize and load the level
    levelManager = new LevelManager(scene);
    levelManager.loadLevel(level);
    levelManager.roomSize = roomSize;


    // Create player
    player = new Player(scene);
    camera.position.set(player.mesh.position.x, player.mesh.position.y+10, player.mesh.position.z+20);
    camera.lookAt(player.mesh.position.x, player.mesh.position.y, player.mesh.position.z);

    interectionSystem = new InteractionSystem(scene, camera);
    interectionSystem.setPlayer(player.mesh);
    console.log(levelManager.rooms[level-1])
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
                            console.log("wrtgsdfs")
                            roomCenter[2] -= roomSize[0];
                            levelManager.loadLevel(level+1);

                            levelManager.rooms[level].wallIn.position.y -=30

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



    console.log(levelManager.rooms[level -1].wallOut)


    animate();
}

function animate() {
    requestAnimationFrame(animate);
    player.update(); // Update player position
    controls.update();
    interectionSystem.update();
    cameraControls.update();
    levelManager.update();
    //camera.position.set(player.mesh.position.x, player.mesh.position.y, player.mesh.position.z-10);
    //camera.lookAt(player.mesh.position.x, player.mesh.position.y, player.mesh.position.z);
    // Clamp the camera's position within the room boundaries
    //const roomSize = 25; // Half the size of the room since the room is 30x30
    //camera.position.x = THREE.MathUtils.clamp(camera.position.x, -roomSize + 1, roomSize - 1);
    //camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1, 9); // Stay within the floor and ceiling
    //camera.position.z = THREE.MathUtils.clamp(camera.position.z, -roomSize + 1, roomSize - 1);

    renderer.render(scene, camera);
}


