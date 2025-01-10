import * as THREE from 'three';

import { Door } from '../objects/Door.js';
import { Pulley } from '../objects/Pulley.js';
import { Rope } from '../objects/Rope.js';
import { Weight } from '../objects/Weight.js';
import levels from './levelConfig.json';

export class Level{
    constructor(room){
        this.room = room;
        this.scene = this.room.scene;
        this.objects=[];
        this.pos = this.room.position;
        if(this.pos == 0){
            this.doorIn = new Door(this.scene, [0, 15, -25+this.pos ]);
        }
        this.doorOut = new Door(this.scene, [0, 15, 25+this.pos ]);
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
                position = obj.position;
                position[2] += this.pos; // Adjust based on the level offset
                object = new Pulley(this.scene, position, 10);
                this.objects.push(object);
                break;
            case "weight":
                position = obj.position
                position[2] += this.pos
                object = new Weight(this.scene ,position);
                this.objects.push(object);

                break;
            case "rope":
                object = new Rope(this.scene);
                this.objects.push(object);

                break
        }
    }


}