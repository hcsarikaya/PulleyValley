
import AmmoModule from '../../builds/ammo.wasm.js';

export class PhysicsWorld {
    constructor() {
        this.AmmoLib = null;
        this.physicsWorld = null;
        this.softBodyHelpers = null;
        this.initialized = false;
    }

    /**
     * Initialize the Ammo library (async).
     */
    async init() {
        // 2. Await the factory function returned by AmmoModule
        this.AmmoLib = await AmmoModule({
            // 3. locateFile to find the WASM if needed
            locateFile: (path) => {
                if (path.endsWith('.wasm')) {
                    return '../builds/ammo.wasm.wasm';
                }
                return path;
            }
        });

        // 4. Now we can safely access things like this.AmmoLib.btSoftBodyRigidBodyCollisionConfiguration
        const collisionConfiguration =
            new this.AmmoLib.btSoftBodyRigidBodyCollisionConfiguration();
        const dispatcher =
            new this.AmmoLib.btCollisionDispatcher(collisionConfiguration);
        const broadphase =
            new this.AmmoLib.btDbvtBroadphase();
        const solver =
            new this.AmmoLib.btSequentialImpulseConstraintSolver();
        const softBodySolver =
            new this.AmmoLib.btDefaultSoftBodySolver();

        this.physicsWorld =
            new this.AmmoLib.btSoftRigidDynamicsWorld(
                dispatcher,
                broadphase,
                solver,
                collisionConfiguration,
                softBodySolver
            );

        // Set gravity
        this.physicsWorld.setGravity(new this.AmmoLib.btVector3(0, -9.81, 0));
        this.physicsWorld
            .getWorldInfo()
            .set_m_gravity(new this.AmmoLib.btVector3(0, -9.81, 0));

        // Helper for creating soft bodies
        this.softBodyHelpers = new this.AmmoLib.btSoftBodyHelpers();

        this.initialized = true;
    }

    /**
     * Step the simulation each frame
     */
    update(deltaTime) {
        if (!this.initialized) return;
        // stepSimulation(timeStep, maxSubSteps)
        this.physicsWorld.stepSimulation(deltaTime, 10);
    }
}
