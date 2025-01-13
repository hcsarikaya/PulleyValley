
import {Room} from "./Room.js";
import {Level} from "../levels/level.js";


export class LevelManager {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld; // <<-- store reference
        this.pos = 0;
        this.levels = []
        this.roomSize = [80,50,45]
        this.rooms = []
        this.checkLevel = false
        this.currentLevel = 1;
    }

    async loadLevel() {


        for(let i = 0; i < 4; i++) {
            this.rooms.push(new Room(this.scene, this.roomSize, this.physicsWorld));
            this.rooms[i].createRoom(this.pos);
            this.pos = this.pos- this.roomSize[1];

            this.levels.push(new Level(this.rooms[i], this.physicsWorld));
            await this.levels[i].addObject(i);
        }





    };
    levelAnimation(level, check){
        //console.log(this.rooms[level -1].wallOut.position.y)
        if(check && Number(this.rooms[level -1].wallOut.position.y) < 68){
            this.rooms[level -1].wallOut.position.y +=0.15
            this.levels[level-1].doorOut.mesh.position.y += 0.15

            this.rooms[level].wallIn.position.y +=0.15

        }else{
            check = false;
        }
    }


    update() {
        if(this.checkLevel){
            this.levelAnimation(this.currentLevel, this.checkLevel)
        }

    }
}
