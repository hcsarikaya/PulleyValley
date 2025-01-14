
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
        let firstRoom = new Room(this.scene, this.roomSize, this.physicsWorld)
        firstRoom.createRoom(this.pos +this.roomSize[1]);
        firstRoom.wallIn = firstRoom.createWallWithPhysics(
            [firstRoom.size[0], firstRoom.size[2], 1],
            [0, firstRoom.size[2]/2, firstRoom.size[1]/2 + this.pos+this.roomSize[1]])
        this.scene.add(firstRoom.wallIn);
        this.rooms.push(firstRoom);
        this.levels.push(new Level(this.rooms[0], this.physicsWorld));
        await this.levels[0].addObject(0);


        for(let i = 1; i < 5; i++) {
            this.rooms.push(new Room(this.scene, this.roomSize, this.physicsWorld));
            this.rooms[i].createRoom(this.pos);
            this.pos = this.pos- this.roomSize[1];

            this.levels.push(new Level(this.rooms[i], this.physicsWorld));
            await this.levels[i].addObject(i);
        }
        let LastRoom = new Room(this.scene, this.roomSize, this.physicsWorld)
        LastRoom.createRoom(this.pos);
        LastRoom.wallOut = LastRoom.createWallWithPhysics(
            [LastRoom.size[0], LastRoom.size[2], 1],
            [0, LastRoom.size[2]/2, -LastRoom.size[1]/2 + this.pos])
        this.scene.add(LastRoom.wallOut);
        






    };
    levelAnimation(level, check){
        //console.log(this.rooms[level -1].wallOut.position.y)
        if(check && Number(this.rooms[level -1].wallOut.position.y) < 68){
            this.rooms[level -1].wallOut.position.y +=0.15
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
