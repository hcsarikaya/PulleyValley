// Import statements remain unchanged
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { Player } from './Player.js';
import { LevelManager } from './LevelManager.js';
import { InteractionSystem } from "../controls/InteractionSystem.js";
import { CameraControls } from '../controls/CameraControls.js';
import { DustParticleSystem } from '../objects/DustParticleSystem.js';
import { WizardParticleSystem } from "../objects/WizardParticleSystem.js";
import { NightVisionShader } from '../shaders/NightVisionShader.js';

import { PhysicsWorld } from '../objects/PhysicsWorld.js';
//import InventoryUI from '../ui/InventoryUI.js';
import SoundManager from './SoundManager.js';
import HelpMenu from '../ui/HelpMenu.js';
import SettingsMenu from "../ui/SettingsMenu.js";

let scene, camera, renderer;
let cameraControls, physicsWorld;
let player, levelManager, interectionSystem;
let clock;
let dustSystem, wizardSystem;
let lastSpawnTime = 0;
const spawnInterval = 1.0;
const dustSpawnPosition = new THREE.Vector3(0, 0, 0);
let helpMenu, settingsMenu, soundManager;
let stopwatchElement;
let spotlight1, spotlight2;
let composer, nightVisionPass;
let nightVisionEnabled = false;

// Add movement speed constant for spotlight
const SPOTLIGHT_MOVE_SPEED = 2;

export async function initGame(level) {
    // 1) SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);  // Black background
    scene.fog = null;

    // 2) PHYSICS
    physicsWorld = new PhysicsWorld();
    await physicsWorld.init();

    // 3) CAMERA
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 10, 20); // Move camera back a bit

    // 4) RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Enable shadow map for dynamic lighting/shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;  // Ensure proper color space
    renderer.toneMapping = THREE.ACESFilmicToneMapping;  // Better light distribution
    renderer.toneMappingExposure = 1.0;  // Adjust exposure
    document.getElementById('game-container').appendChild(renderer.domElement);

    // 5) CAMERA CONTROLS
    cameraControls = new CameraControls(camera, renderer);

    // 6) CLOCK
    clock = new THREE.Clock();

    // 7) PARTICLE SYSTEMS
    dustSystem = new DustParticleSystem(scene);
    wizardSystem = new WizardParticleSystem(scene, camera);

    // 8) LIGHTING
    // Base ambient light for overall visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // First room spotlight
    spotlight1 = new THREE.SpotLight(0xffffff, 10.0);
    spotlight1.position.set(0, 40, 0);
    spotlight1.target.position.set(0, 0, 0);
    scene.add(spotlight1.target);

    spotlight1.angle = Math.PI / 2.5;
    spotlight1.penumbra = 0.1;
    spotlight1.decay = 0.2;
    spotlight1.distance = 200;

    spotlight1.castShadow = true;
    spotlight1.shadow.mapSize.width = 2048;
    spotlight1.shadow.mapSize.height = 2048;
    spotlight1.shadow.camera.near = 1;
    spotlight1.shadow.camera.far = 200;
    spotlight1.shadow.camera.fov = 90;
    spotlight1.shadow.bias = -0.001;

    scene.add(spotlight1);

    // Second room spotlight
    spotlight2 = new THREE.SpotLight(0xffffff, 10.0);
    spotlight2.position.set(25, 41, -60);
    spotlight2.target.position.set(10, 0, -60);
    scene.add(spotlight2.target);

    spotlight2.angle = Math.PI / 2.5;
    spotlight2.penumbra = 0.1;
    spotlight2.decay = 0.2;
    spotlight2.distance = 200;

    spotlight2.castShadow = true;
    spotlight2.shadow.mapSize.width = 2048;
    spotlight2.shadow.mapSize.height = 2048;
    spotlight2.shadow.camera.near = 1;
    spotlight2.shadow.camera.far = 200;
    spotlight2.shadow.camera.fov = 90;
    spotlight2.shadow.bias = -0.001;

    scene.add(spotlight2);

    // 9) LEVEL MANAGER
    let roomSize = [80, 50, 45];
    levelManager = new LevelManager(scene, physicsWorld);
    levelManager.roomSize = roomSize;

    await levelManager.loadLevel(Number(level));

    // 10) PLAYER
    player = new Player(scene, cameraControls.camera, physicsWorld);

    // 11) INTERACTION SYSTEM
    interectionSystem = new InteractionSystem(scene, camera, physicsWorld);
    interectionSystem.setPlayer(player.mesh);

    // Add interactive objects based on category
    levelManager.levels.forEach(lvl => {
        lvl.objects.forEach(obj => {
            interectionSystem.addInteractiveObject(obj)

        });
    });

    // 12) MENUS / UI
    helpMenu = new HelpMenu();
    soundManager = new SoundManager();
    soundManager.loadSounds();
    soundManager.playMusic();
    settingsMenu = new SettingsMenu(soundManager, (newSensitivity) => {
        cameraControls.mouseSensitivity = newSensitivity;
    });

    // post-processing
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Add night vision pass
    nightVisionPass = new ShaderPass(NightVisionShader);
    nightVisionPass.enabled = false; 
    composer.addPass(nightVisionPass);

    document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'h') {
            helpMenu.toggle();
        }
        if (event.key.toLowerCase() === 'k') {
            spotlight1.visible = !spotlight1.visible;
            spotlight2.visible = !spotlight2.visible;
            if (spotlight1.visible) {
                nightVisionPass.enabled = false;
                nightVisionEnabled = false;
            }
        }
        if (event.key === '1') {
            if (!spotlight1.visible) {
                nightVisionEnabled = !nightVisionEnabled;
                nightVisionPass.enabled = nightVisionEnabled;
            }
        }
        if (event.key === '+' || event.key === '=') {
            spotlight1.intensity = Math.min(20, spotlight1.intensity + 1);
        }
        if (event.key === '-' || event.key === '_') {
            spotlight1.intensity = Math.max(0, spotlight1.intensity - 1);
        }

        // Spotlight position controls
        switch(event.key) {
            case 'ArrowUp':
                if (event.shiftKey) {
                    // Move forward (Z-axis)
                    spotlight1.position.z -= SPOTLIGHT_MOVE_SPEED;
                    spotlight1.target.position.z -= SPOTLIGHT_MOVE_SPEED;
                } else {
                    // Move up (Y-axis)
                    spotlight1.position.y += SPOTLIGHT_MOVE_SPEED;
                }
                break;
            case 'ArrowDown':
                if (event.shiftKey) {
                    // Move backward (Z-axis)
                    spotlight1.position.z += SPOTLIGHT_MOVE_SPEED;
                    spotlight1.target.position.z += SPOTLIGHT_MOVE_SPEED;
                } else {
                    // Move down (Y-axis)
                    spotlight1.position.y -= SPOTLIGHT_MOVE_SPEED;
                }
                break;
            case 'ArrowLeft':
                // Move left (X-axis)
                spotlight1.position.x -= SPOTLIGHT_MOVE_SPEED;
                spotlight1.target.position.x -= SPOTLIGHT_MOVE_SPEED;
                break;
            case 'ArrowRight':
                // Move right (X-axis)
                spotlight1.position.x += SPOTLIGHT_MOVE_SPEED;
                spotlight1.target.position.x += SPOTLIGHT_MOVE_SPEED;
                break;
        }
    });

    // 13) STOPWATCH
    initializeStopwatch();

    // 14) START ANIMATION
    animate();
}

function initializeStopwatch() {
    stopwatchElement = document.getElementById('stopwatch');
    if (!stopwatchElement) {
        console.error('Stopwatch element not found in the DOM.');
        return;
    }
    clock.start();
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (nightVisionPass) {
        nightVisionPass.uniforms.time.value = clock.getElapsedTime();
    }

    // Update player, interactions, camera
    player.update();
    interectionSystem.update();
    cameraControls.update(delta);

    // Update Level Manager / physics
    levelManager.update();
    physicsWorld.update(delta);

    // Update floor shader uniforms for spotlight changes
    levelManager.rooms.forEach(room => {
        if (room.floor && room.floor.userData.woodShaderMaterial) {
            const material = room.floor.userData.woodShaderMaterial;
            // Update first spotlight properties
            material.uniforms.spotLights.value[0] = {
                position: spotlight1.position,
                direction: new THREE.Vector3(0, -1, 0),
                color: new THREE.Color(0xffffff),
                distance: spotlight1.distance,
                decay: spotlight1.decay,
                coneCos: Math.cos(spotlight1.angle),
                penumbraCos: Math.cos(spotlight1.angle + spotlight1.penumbra),
                intensity: spotlight1.intensity,
                visible: spotlight1.visible
            };
            // Update second spotlight properties
            material.uniforms.spotLights.value[1] = {
                position: spotlight2.position,
                direction: new THREE.Vector3(0, -1, 0),
                color: new THREE.Color(0xffffff),
                distance: spotlight2.distance,
                decay: spotlight2.decay,
                coneCos: Math.cos(spotlight2.angle),
                penumbraCos: Math.cos(spotlight2.angle + spotlight2.penumbra),
                intensity: spotlight2.intensity,
                visible: spotlight2.visible
            };
        }
    });

    // Let each object sync with Ammo.js
    levelManager.levels.forEach(lvl => {
        lvl.objects.forEach(obj => {
            if (obj.update) obj.update();
        });
    });

    // Particle systems
    dustSystem.update(delta);
    wizardSystem.update(delta);

    // Spawn dust at intervals
    const now = clock.getElapsedTime();
    if (now - lastSpawnTime >= spawnInterval) {
        lastSpawnTime = now;
        dustSystem.spawnDust(dustSpawnPosition, 50);
    }

    updateStopwatch();
    composer.render();
}

function updateStopwatch() {
    if (!stopwatchElement) return;
    const elapsedTime = clock.getElapsedTime(); // in seconds
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
