import { Room } from "./Room.js";
import { Level } from "../levels/level.js";

export class LevelManager {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld; // <<-- store reference
        this.pos = 0;
        this.levels = [];
        this.roomSize = [50, 50, 30];
    }

    loadLevel(level) {
        console.log('loadLevel called with level:', level);

        // Optionally clear the scene or keep your existing objects
        /*
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        */

        // Create a room for the new level
        const room = new Room(this.scene, this.roomSize);
        room.createRoom(this.pos);

        // Increment position for the next room
        this.pos += this.roomSize[0];

        // Pass physicsWorld down to the Level
        const newLevel = new Level(room, this.physicsWorld);
        newLevel.addObject(level);

        // Keep track of newly added level
        this.levels.push(newLevel);
        console.log('After loadLevel, levels array:', this.levels);
    }
}
