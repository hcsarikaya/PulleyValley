
import {Room} from "./Room.js";
import {Level} from "../levels/level.js";


export class LevelManager {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld; // <<-- store reference
        this.pos = 0;
        this.levels = []
        this.roomSize = [50,50,30]
    }

    loadLevel(level) {
        // Clear the current scene (remove previous objects)
        /*
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

         */


        const room = new Room(this.scene, this.roomSize);
        room.createRoom(this.pos);
        this.pos = this.pos+ this.roomSize[0];

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======

        this.rooms.push(new Room(this.scene, this.roomSize, this.physicsWorld));
        this.rooms[level-1].createRoom(this.pos);
        this.pos = this.pos- this.roomSize[0];

        this.levels.push(new Level(this.rooms[level-1], this.physicsWorld));
        this.levels[level-1].addObject(level);


=======

        this.rooms.push(new Room(this.scene, this.roomSize, this.physicsWorld));
        this.rooms[level-1].createRoom(this.pos);
        this.pos = this.pos- this.roomSize[0];

        this.levels.push(new Level(this.rooms[level-1], this.physicsWorld));
        this.levels[level-1].addObject(level);


>>>>>>> Stashed changes
    };
    levelAnimation(level, check){
        //console.log(this.rooms[level -1].wallOut.position.y)
        if(check && Number(this.rooms[level -1].wallOut.position.y) < 45){
            this.rooms[level -1].wallOut.position.y +=0.1
            this.levels[level-1].doorOut.mesh.position.y += 0.1

            this.rooms[level].wallIn.position.y +=0.1
            //this.levels[level].doorIn.mesh.position.y += 0.1
        }else{
            check = false;
        }
    }


    update() {
        if(this.checkLevel){
            this.levelAnimation(this.currentLevel, this.checkLevel)
        }

>>>>>>> Stashed changes
    }
}
