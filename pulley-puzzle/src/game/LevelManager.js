
import {Room} from "./Room.js";
import {Level} from "../levels/level.js";


export class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.pos = 0;
        this.levels = []
    }

    loadLevel(level) {
        // Clear the current scene (remove previous objects)
        /*
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

         */


        const room = new Room(this.scene);
        room.createRoom(this.pos);
        this.pos = this.pos+ 50;

        this.levels.push(new Level(room));
        this.levels[level-1].addObject(level);
        // Load the appropriate level based on level number
        /*

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
        */
    }
}
