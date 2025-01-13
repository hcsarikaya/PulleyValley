import * as THREE from 'three';

export class Button {
    constructor(scene, physicsWorld, position = [5, 0.5, 5], opt) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.category = 'button';
        this.opt = opt;
        this.isPressed = false;
        this.overlappingBodies = new Set();
        this.initialHeight = position[1];  // Store initial height for animation

        // Create visual mesh
        const geometry = new THREE.BoxGeometry(4, 1, 4);
        const material = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 30
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position[0], position[1], position[2]);

        // Enable shadows
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        scene.add(this.mesh);

        // Create physics body
        this.createPhysicsBody(position);

        // Animation properties
        this.targetY = this.initialHeight;
        this.currentY = this.initialHeight;
        this.animationSpeed = 0.2; // Adjust this to control animation speed
    }

    createPhysicsBody(position) {
        // Create a box shape for the button
        const shape = new this.physicsWorld.AmmoLib.btBoxShape(
            new this.physicsWorld.AmmoLib.btVector3(2, 0.5, 2) // Half-extents (half of 4,1,4)
        );

        // Create transform
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new this.physicsWorld.AmmoLib.btVector3(position[0], position[1], position[2])
        );

        // Set mass to 0 for static body
        const mass = 0;
        const localInertia = new this.physicsWorld.AmmoLib.btVector3(0, 0, 0);

        // Create motion state
        const motionState = new this.physicsWorld.AmmoLib.btDefaultMotionState(transform);

        // Create rigid body
        const rbInfo = new this.physicsWorld.AmmoLib.btRigidBodyConstructionInfo(
            mass,
            motionState,
            shape,
            localInertia
        );
        this.body = new this.physicsWorld.AmmoLib.btRigidBody(rbInfo);

        // Set as trigger volume
        this.body.setCollisionFlags(this.body.getCollisionFlags() | 4); // CF_NO_CONTACT_RESPONSE

        // Add the rigid body to the physics world
        this.physicsWorld.physicsWorld.addRigidBody(this.body);

        // Store the button instance in the rigid body's user data
        this.body.button = this;
    }

    update(deltaTime) {
        // Check for collisions
        this.checkCollisions();

        // Update button position with smooth animation
        if (this.isPressed) {
            console.log("sdf")
            this.targetY = this.initialHeight - 0.2; // Pressed position
        } else {
            this.targetY = this.initialHeight; // Original position
        }

        // Smoothly interpolate current position to target position
        this.currentY += (this.targetY - this.currentY) * this.animationSpeed;

        // Update visual mesh position
        this.mesh.position.y = this.currentY;

        // Update physics body position
        const transform = new this.physicsWorld.AmmoLib.btTransform();
        const motionState = this.body.getMotionState();
        motionState.getWorldTransform(transform);

        const origin = transform.getOrigin();
        origin.setY(this.currentY);
        transform.setOrigin(origin);
        motionState.setWorldTransform(transform);
    }

    checkCollisions() {
        const dispatcher = this.physicsWorld.physicsWorld.getDispatcher();
        const numManifolds = dispatcher.getNumManifolds();

        // Clear previous state
        const previouslyPressed = this.isPressed;
        this.overlappingBodies.clear();

        // Check all collision manifolds
        for (let i = 0; i < numManifolds; i++) {
            const contactManifold = dispatcher.getManifoldByIndexInternal(i);
            const body0 = contactManifold.getBody0();
            const body1 = contactManifold.getBody1();

            // Check if this button is involved in the collision
            if (body0 === this.body || body1 === this.body) {
                const otherBody = body0 === this.body ? body1 : body0;
                this.overlappingBodies.add(otherBody);
            }
        }

        // Update button state
        this.isPressed = this.overlappingBodies.size > 0;

        // If state changed, trigger appropriate callbacks
        if (previouslyPressed !== this.isPressed) {
            if (this.isPressed) {
                this.onButtonPressed();
            } else {
                this.onButtonReleased();
            }
        }
    }

    onButtonPressed() {
        // Visual feedback - only color change, position is handled by update
        this.mesh.material.color.setHex(0x666666);

        // Trigger callback if provided
        if (this.opt && this.opt.onPressed) {
            this.opt.onPressed();
        }
    }

    onButtonReleased() {
        // Visual feedback - only color change, position is handled by update
        this.mesh.material.color.setHex(0x333333);

        // Trigger callback if provided
        if (this.opt && this.opt.onReleased) {
            this.opt.onReleased();
        }
    }

    isObjectOnButton(object) {
        if (!object.body) return false;
        return this.overlappingBodies.has(object.body);
    }

    getNumberOfObjectsOnButton() {
        return this.overlappingBodies.size;
    }

    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.body) {
            this.physicsWorld.physicsWorld.removeRigidBody(this.body);
        }
    }
}