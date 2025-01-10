import * as THREE from 'three';

import { Door } from '../objects/Door.js';
import { Pulley } from '../objects/Pulley.js';
import { Rope } from '../objects/Rope.js';
import { Weight } from '../objects/Weight.js';
import levels from './levelConfig.json';

export class Level{
    constructor(room, physicsWorld){
        this.room = room;
        this.scene = this.room.scene;
        this.objects=[];
        this.pos = this.room.position;
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        if(this.pos == 0){
            this.doorIn = new Door(this.scene, [0, 15, -25+this.pos ]);
        }
        this.doorOut = new Door(this.scene, [0, 15, 25+this.pos ]);
=======
        this.physicsWorld = physicsWorld;


        if(this.pos == 0){
=======
        this.physicsWorld = physicsWorld;


        if(this.pos == 0){
>>>>>>> Stashed changes
            this.doorIn = new Door(this.scene,this.physicsWorld, [0, 15, +25+this.pos ]);

        }
        this.doorOut = new Door(this.scene,this.physicsWorld, [0, 15, -25+this.pos ]);

>>>>>>> Stashed changes
    }

    addObject(level){

        const data = levels.levels[level-1].objects;
        data.forEach(obj=> {
            this.createObject(obj);
        })


    }


    createObject(obj) {


        let object;
        let position;
        switch (obj.type) {
            case "pulley":
                position = obj.position
                position[2] += this.pos
                object = new Pulley(this.scene ,this.physicsWorld,position);
                this.objects.push(object)
                break;
            case "weight":
                position = obj.position
                position[2] += this.pos
                object = new Weight(this.scene,this.physicsWorld ,position);
                this.objects.push(object);

                break;
            case "rope":
<<<<<<< Updated upstream
=======

                object = new Rope(this.scene,this.physicsWorld ,this.objects[0],this.objects[1], 10);
                this.objects.push(object);
>>>>>>> Stashed changes

                object = new Rope(this.scene,this.physicsWorld ,this.objects[0],this.objects[1], 10);
                this.objects.push(object);

                break
        }
    }


}