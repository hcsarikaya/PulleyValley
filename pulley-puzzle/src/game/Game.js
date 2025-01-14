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
import { PixelationShader } from '../shaders/PixelationShader.js';

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
let spotlight1, spotlight2, spotlight3, spotlight4, spotlight5,spotlight6;
let composer, nightVisionPass, pixelationPass;
let nightVisionEnabled = false;
let pixelationLevel = 0; // 0: off, 1: subtle, 2: medium, 3: strong

// Pixelation levels configuration
const PIXEL_SIZES = {
    1: 4.0,  // Subtle pixelation
    2: 8.0,  // Medium pixelation
    3: 16.0  // Strong pixelation
};

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

    // Create spotlights for all rooms
    // First room spotlight
    spotlight1 = new THREE.SpotLight(0xffffff, 10.0);
    spotlight1.position.set(0, 40, 0);
    spotlight1.target.position.set(0, 0, 0);
    setupSpotlight(spotlight1);

    // Second room spotlight
    spotlight2 = new THREE.SpotLight(0xffffff, 10.0);
    spotlight2.position.set(25, 41, -45);
    spotlight2.target.position.set(10, 0, -45);
    setupSpotlight(spotlight2);

    // Third room spotlight
    spotlight3 = new THREE.SpotLight(0xffffff, 10.0);
    spotlight3.position.set(0, 40, -90);
    spotlight3.target.position.set(0, 0, -90);
    setupSpotlight(spotlight3);

    // Fourth room spotlight
    spotlight4 = new THREE.SpotLight(0xffffff, 10.0);
    spotlight4.position.set(0, 40, -135);
    spotlight4.target.position.set(0, 0, -135);
    setupSpotlight(spotlight4);

    // Fifth room spotlight
    spotlight5 = new THREE.SpotLight(0xffffff, 10.0);
    spotlight5.position.set(0, 40, -180);
    spotlight5.target.position.set(0, 0, -180);
    setupSpotlight(spotlight5);
    // Fifth room spotlight
    spotlight6 = new THREE.SpotLight(0xffffff, 10.0);
    spotlight6.position.set(0, 40, -180);
    spotlight6.target.position.set(0, 0, -180);
    setupSpotlight(spotlight6);

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
            if(obj.category !== "rope"){
                interectionSystem.addInteractiveObject(obj)
            }


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

    // Add pixelation pass
    pixelationPass = new ShaderPass(PixelationShader);
    pixelationPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    pixelationPass.enabled = false;
    composer.addPass(pixelationPass);

    // Handle window resize
    window.addEventListener('resize', () => {
        pixelationPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'h') {
            helpMenu.toggle();
        }
        if (event.key.toLowerCase() === 'k') {
            // Toggle all spotlights
            spotlight1.visible = !spotlight1.visible;
            spotlight2.visible = !spotlight2.visible;
            spotlight3.visible = !spotlight3.visible;
            spotlight4.visible = !spotlight4.visible;
            spotlight5.visible = !spotlight5.visible;
            if (spotlight1.visible) {
                nightVisionPass.enabled = false;
                nightVisionEnabled = false;
            }
        }

        if (event.key === '+' || event.key === '=') {
            // Increase intensity for all spotlights
            const newIntensity = Math.min(20, spotlight1.intensity + 1);
            spotlight1.intensity = newIntensity;
            spotlight2.intensity = newIntensity;
            spotlight3.intensity = newIntensity;
            spotlight4.intensity = newIntensity;
            spotlight5.intensity = newIntensity;
        }
        if (event.key === '-' || event.key === '_') {
            // Decrease intensity for all spotlights
            const newIntensity = Math.max(0, spotlight1.intensity - 1);
            spotlight1.intensity = newIntensity;
            spotlight2.intensity = newIntensity;
            spotlight3.intensity = newIntensity;
            spotlight4.intensity = newIntensity;
            spotlight5.intensity = newIntensity;
        }

        if (event.key === '1') {
            if (!spotlight1.visible) {
                nightVisionEnabled = !nightVisionEnabled;
                nightVisionPass.enabled = nightVisionEnabled;
                if (nightVisionEnabled) {
                    pixelationLevel = 0;
                    pixelationPass.enabled = false;
                }
            }
        }
        if (event.key === '2') {
            pixelationLevel = (pixelationLevel + 1) % 4; // 0->1->2->3->0
            
            if (pixelationLevel === 0) {
                pixelationPass.enabled = false;
            } else {
                pixelationPass.enabled = true;
                pixelationPass.uniforms.pixelSize.value = PIXEL_SIZES[pixelationLevel];
                
                nightVisionEnabled = false;
                nightVisionPass.enabled = false;
            }
        }

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
    levelManager.rooms.forEach((room, index) => {
        if (room.floor && room.floor.userData.woodShaderMaterial) {
            const material = room.floor.userData.woodShaderMaterial;
            const spotlights = [spotlight1, spotlight2, spotlight3, spotlight4, spotlight5,spotlight6];
            
            // Update spotlight properties for this room's floor
            // First spotlight (main light for this room)
            material.uniforms.spotLights.value[0] = {
                position: spotlights[index].position,
                direction: new THREE.Vector3(0, -1, 0),
                color: new THREE.Color(0xffffff),
                distance: spotlights[index].distance,
                decay: spotlights[index].decay,
                coneCos: Math.cos(spotlights[index].angle),
                penumbraCos: Math.cos(spotlights[index].angle + spotlights[index].penumbra),
                intensity: spotlights[index].intensity,
                visible: spotlights[index].visible
            };

            // Second spotlight (contribution from adjacent room if exists)
            const nextSpotlight = spotlights[index + 1];
            if (nextSpotlight) {
                material.uniforms.spotLights.value[1] = {
                    position: nextSpotlight.position,
                    direction: new THREE.Vector3(0, -1, 0),
                    color: new THREE.Color(0xffffff),
                    distance: nextSpotlight.distance,
                    decay: nextSpotlight.decay,
                    coneCos: Math.cos(nextSpotlight.angle),
                    penumbraCos: Math.cos(nextSpotlight.angle + nextSpotlight.penumbra),
                    intensity: nextSpotlight.intensity * 0.5,
                    visible: nextSpotlight.visible
                };
            } else {
                // For the last room, use the previous spotlight as secondary
                const prevSpotlight = spotlights[index - 1];
                if (prevSpotlight) {
                    material.uniforms.spotLights.value[1] = {
                        position: prevSpotlight.position,
                        direction: new THREE.Vector3(0, -1, 0),
                        color: new THREE.Color(0xffffff),
                        distance: prevSpotlight.distance,
                        decay: prevSpotlight.decay,
                        coneCos: Math.cos(prevSpotlight.angle),
                        penumbraCos: Math.cos(prevSpotlight.angle + prevSpotlight.penumbra),
                        intensity: prevSpotlight.intensity * 0.5,
                        visible: prevSpotlight.visible
                    };
                }
            }
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

// Helper function to setup spotlight properties
function setupSpotlight(spotlight) {
    scene.add(spotlight.target);
    
    spotlight.angle = Math.PI / 2.5;
    spotlight.penumbra = 0.1;
    spotlight.decay = 0.2;
    spotlight.distance = 200;
    
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 2048;
    spotlight.shadow.mapSize.height = 2048;
    spotlight.shadow.camera.near = 1;
    spotlight.shadow.camera.far = 200;
    spotlight.shadow.camera.fov = 90;
    spotlight.shadow.bias = -0.001;
    
    scene.add(spotlight);
}
