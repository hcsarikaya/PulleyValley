import { loadLevel1 } from '../levels/Level1.js';
import { loadLevel2 } from '../levels/Level2.js';
import {createRoom} from "./Room.js";

export class LevelManager {
    constructor(scene) {
        this.scene = scene;
    }

    loadLevel(level) {
        // Clear the current scene (remove previous objects)
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        // Recreate the dungeon room

        createRoom(this.scene);

        // Load the appropriate level based on level number
        switch (level) {
            case "1":
                loadLevel1(this.scene);
                break;
            case "2":
                loadLevel2(this.scene);
                break;
            default:
                console.error('Level not implemented!');
        }
    }
}
