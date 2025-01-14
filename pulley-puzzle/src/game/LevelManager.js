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
        let lastRoom = new Room(this.scene, this.roomSize, this.physicsWorld)
        lastRoom.createRoom(this.pos);
        lastRoom.wallOut = lastRoom.createWallWithPhysics(
            [lastRoom.size[0], lastRoom.size[2], 1],
            [0, lastRoom.size[2]/2, -lastRoom.size[1]/2 + this.pos])
        this.rooms.push(lastRoom)
        this.levels.push(new Level(this.rooms[5], this.physicsWorld));
        await this.levels[5].addObject(5);
        this.scene.add(lastRoom.wallOut);






    };
    levelAnimation(level){
        const boulder = this.levels[level].objects.find(obj => obj.category === "boulder");
        const pallet = this.levels[level].objects.find(obj => obj.category === "pallet");
        const rope1 = this.levels[level].objects.find(obj => obj.name === "rope1");
        const rope2 = this.levels[level].objects.find(obj => obj.category === "rope2");




    }
    checkLevelFinish(level){
        level.objects.forEach(object => {

            if(object.category === "weight"){
                if(object.model.userData.totalMass === 10){
                    level.levelFinished = true;
                    return true;
                }
            }
        })
        return false;
    }


    update() {
        this.levels.forEach(level => {
            if(this.checkLevelFinish(level)){
                this.levelAnimation(level)
            }
        })

        // Add this to update trigger zones
        if (this.levels[this.currentLevel - 1]) {
            this.levels[this.currentLevel - 1].update();
        }
    }
}
