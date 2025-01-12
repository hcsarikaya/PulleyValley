// Import statements remain unchanged
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Player } from './Player.js';
import { LevelManager } from './LevelManager.js';
import { InteractionSystem } from "../controls/InteractionSystem.js";
import { CameraControls } from '../controls/CameraControls.js';
//import InventoryUI from '../ui/InventoryUI.js';
import SoundManager from './SoundManager.js';
import HelpMenu from '../ui/HelpMenu.js';
import SettingsMenu from "../ui/SettingsMenu.js";
import { DustParticleSystem } from '../objects/DustParticleSystem.js';
import { WizardParticleSystem } from "../objects/WizardParticleSystem.js";
import { PhysicsWorld } from '../objects/PhysicsWorld.js';

// Declare variables
let scene, camera, renderer, controls, player, levelManager, interectionSystem, cameraControls, inventoryUI, soundManager, helpMenu, settingsMenu;
let clock;  // Initialize clock here
let physicsWorld;
let dustSystem;
let wizardSystem;

let lastSpawnTime = 0;
const spawnInterval = 1.0; // 1 second
const dustSpawnPosition = new THREE.Vector3(0, 0, 0); // wherever you want dust

let stopwatchElement; // Add this line to reference the stopwatch DOM element

export async function initGame(level) {
    // Initialize scene
    scene = new THREE.Scene();
    level = Number(level);

    // Initialize physics
    physicsWorld = new PhysicsWorld();
    await physicsWorld.init(); // Wait for Ammo to load

    // Camera setup
    let roomSize = [80,50,45];
    let roomCenter =  [0,0,0];
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // UI Elements
    //inventoryUI = new InventoryUI('inventory-hotbar');
    helpMenu = new HelpMenu();

    soundManager = new SoundManager();
    soundManager.loadSounds();
    soundManager.playMusic();

    settingsMenu = new SettingsMenu(soundManager, (newSensitivity) => {
        cameraControls.mouseSensitivity = newSensitivity;
    });

    // Renderer setup
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Camera Controls
    cameraControls = new CameraControls(camera, renderer, {});

    // Particle Systems
    dustSystem = new DustParticleSystem(scene);
    wizardSystem = new WizardParticleSystem(scene, camera);

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
    player = new Player(scene, cameraControls.camera, physicsWorld);

    // Interaction System
    interectionSystem = new InteractionSystem(scene, camera, physicsWorld);
    interectionSystem.setPlayer(player.mesh);

    // Add interactive objects based on category
    levelManager.levels.forEach(lvl => {
        lvl.objects.forEach(obj => {
            console.log(obj.category);
            if (['pulley', 'weight', 'boulder'].includes(obj.category)) {
                interectionSystem.addInteractiveObject(obj, {
                    proximityThreshold: 15,
                    promptText: 'Press "E" to collect',
                    onInteract: (objMesh) => {
                        console.log('Collecting...');
                        scene.remove(objMesh);
                        // Optionally, add sound or animation here
                    }
                });
            } else if(obj.category === 'button') {
                switch (obj.opt){
                    case "setting":
                        interectionSystem.addInteractiveObject(obj, {
                            proximityThreshold: 15,
                            promptText: 'Settings',
                            onInteract: (objMesh) => {
                                console.log('Settings...');
                                settingsMenu.toggle(); // Show settings menu
                                // Optionally, remove or disable the button
                            }
                        });
                        break;
                    case 1:
                        interectionSystem.addInteractiveObject(obj, {
                            proximityThreshold: 15,
                            promptText: 'Level 1',
                            onInteract: (objmesh) => {
                                levelManager.rooms[1].wallIn.position.y -=45;
                                levelManager.checkLevel = true;
                                // Optionally, load next level or perform other actions
                            }
                        });
                        break;
                    // Add more cases as needed
                }
            }
        });
    });

    // Add interactive door
    interectionSystem.addInteractiveObject(levelManager.levels[level-1].doorOut, {
        proximityThreshold: 15,
        promptText: 'Press "E" to open door',
        onInteract: (doorMesh) => {
            console.log('Opening door...');
            // Add your door opening animation/logic here
            doorMesh.rotation.y += Math.PI / 2;
            level += 1;
            roomCenter[2] -= roomSize[0];
            levelManager.loadLevel(level);
        }
    });

    // Event listeners for menus
    document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'h') {
            helpMenu.toggle();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'l' || e.key === 'L') {
            settingsMenu.toggle();
        }
    });

    // Initialize Stopwatch
    initializeStopwatch();

    // Start the animation loop
    animate();
}

function initializeStopwatch() {
    // Reference the stopwatch DOM element
    stopwatchElement = document.getElementById('stopwatch');

    if (!stopwatchElement) {
        console.error('Stopwatch element not found in the DOM.');
        return;
    }

    // Initialize and reset the clock
    clock = new THREE.Clock(true); // Starts the clock immediately
}

function animate() {
    requestAnimationFrame(animate);

    // Update game components
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

    // Update particle systems
    dustSystem.update(delta);
    wizardSystem.update(delta);

    // Spawn dust at intervals
    const now = clock.getElapsedTime();
    if (now - lastSpawnTime >= spawnInterval) {
        lastSpawnTime = now;
        dustSystem.spawnDust(dustSpawnPosition, 50);
    }

    // Update Stopwatch
    updateStopwatch();

    // Render the scene
    renderer.render(scene, camera);
}

function updateStopwatch() {
    if (!stopwatchElement) return;

    const elapsedTime = clock.getElapsedTime(); // In seconds
    stopwatchElement.textContent = formatTime(elapsedTime);
}

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const hrsDisplay = hrs > 0 ? `${pad(hrs)}:` : '';
    return `${hrsDisplay}${pad(mins)}:${pad(secs)}`;
}

function pad(num) {
    return num.toString().padStart(2, '0');
}
