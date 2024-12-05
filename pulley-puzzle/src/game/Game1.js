import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as Ammo from 'ammo.js';
import { createPulleySystem } from './PulleySystem.js';
import { createRoom } from './Room.js';
import { Player } from './Player.js';
import { LevelManager } from './LevelManager.js';

class PhysicsWorld {
    constructor(scene) {
        this.scene = scene;
        this.physicsWorld = null;
        this.tmpTransform = null;
        this.rigidBodies = [];
    }

    async initPhysics() {
        // Wait for Ammo.js to load


        // Create collision configuration
        const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        const overlappingPairCache = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();

        // Create discrete dynamics world
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
            dispatcher,
            overlappingPairCache,
            solver,
            collisionConfiguration
        );

        // Set gravity
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.8, 0));

        // Create temporary transform for physics calculations
        this.tmpTransform = new Ammo.btTransform();

        return this;
    }

    createStaticBox(width, height, depth, position, rotation = new THREE.Euler(0, 0, 0), color = 0xcccccc) {
        // Create visual mesh
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhongMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);

        // Position and rotate mesh
        mesh.position.copy(position);
        mesh.rotation.copy(rotation);
        this.scene.add(mesh);

        // Create physics shape
        const shape = new Ammo.btBoxShape(
            new Ammo.btVector3(width / 2, height / 2, depth / 2)
        );

        // Create transform
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new Ammo.btVector3(position.x, position.y, position.z)
        );

        // Set rotation
        const btQuat = new Ammo.btQuaternion();
        btQuat.setEuler(rotation.x, rotation.y, rotation.z);
        transform.setRotation(btQuat);

        // Create motion state
        const motionState = new Ammo.btDefaultMotionState(transform);

        // Create rigid body info (mass 0 for static objects)
        const rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(
            0,
            motionState,
            shape,
            new Ammo.btVector3(0, 0, 0)
        );

        // Create rigid body
        const rigidBody = new Ammo.btRigidBody(rigidBodyInfo);

        // Add to physics world
        this.physicsWorld.addRigidBody(rigidBody);

        return {
            mesh: mesh,
            body: rigidBody
        };
    }

    createDynamicBox(width, height, depth, position, mass = 1, color = 0xff0000) {
        // Create visual mesh
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhongMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);

        // Position mesh
        mesh.position.copy(position);
        this.scene.add(mesh);

        // Create physics shape
        const shape = new Ammo.btBoxShape(
            new Ammo.btVector3(width / 2, height / 2, depth / 2)
        );

        // Create transform
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new Ammo.btVector3(position.x, position.y, position.z)
        );

        // Create motion state
        const motionState = new Ammo.btDefaultMotionState(transform);

        // Calculate inertia
        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        // Create rigid body info
        const rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(
            mass,
            motionState,
            shape,
            localInertia
        );

        // Create rigid body
        const rigidBody = new Ammo.btRigidBody(rigidBodyInfo);

        // Add to physics world and tracking
        this.physicsWorld.addRigidBody(rigidBody);
        this.rigidBodies.push({ mesh, body: rigidBody });

        return {
            mesh: mesh,
            body: rigidBody
        };
    }

    stepSimulation(deltaTime) {
        if (this.physicsWorld) {
            this.physicsWorld.stepSimulation(deltaTime, 10);

            // Update mesh positions based on physics bodies
            this.rigidBodies.forEach(({ mesh, body }) => {
                const motionState = body.getMotionState();
                if (motionState) {
                    const tmpTrans = new Ammo.btTransform();
                    motionState.getWorldTransform(tmpTrans);

                    const origin = tmpTrans.getOrigin();
                    const rotation = tmpTrans.getRotation();

                    mesh.position.set(origin.x(), origin.y(), origin.z());
                    mesh.quaternion.set(
                        rotation.x(),
                        rotation.y(),
                        rotation.z(),
                        rotation.w()
                    );
                }
            });
        }
    }
}

let scene, camera, renderer, controls, player, levelManager, physicsWorld;

export async function initGame(level) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2;

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 10, 5);
    scene.add(pointLight);

    // Initialize Physics World
    physicsWorld = new PhysicsWorld(scene);
    await physicsWorld.initPhysics();

    // Create dungeon room with physics
    createRoom(scene, physicsWorld);

    // Initialize and load the level
    levelManager = new LevelManager(scene, physicsWorld);
    levelManager.loadLevel(level);

    // Create player
    player = new Player(scene, physicsWorld);
    camera.position.set(
        player.mesh.position.x,
        player.mesh.position.y + 10,
        player.mesh.position.z + 20
    );
    camera.lookAt(
        player.mesh.position.x,
        player.mesh.position.y,
        player.mesh.position.z
    );

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Step physics simulation
    physicsWorld.stepSimulation(1/60);

    player.update();
    controls.update();

    renderer.render(scene, camera);
}

// Export PhysicsWorld for use in other modules
export { PhysicsWorld };