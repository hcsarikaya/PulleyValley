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
        this.doorIn = new Door(this.scene, [0, 15, -25 ]);
        this.doorOut = new Door(this.scene, [0, 15, 25 ]);
    }

    addObject(level){

        const data = levels.levels[level-1].objects;
        data.forEach(obj=> {
            this.createObject(obj);
        })

        console.log(levels.levels[level-1].objects);
    }


    createObject(obj) {


        let object;
        switch (obj.type) {
            case "pulley":
                object = new Pulley(this.scene ,obj.position);
                this.objects.push(object)
                break;
            case "weight":
                object = new Weight(this.scene ,obj.position);
                this.objects.push(object);

                break;
            case "rope":
                object = new Rope(this.scene);
                this.objects.push(object);

                break
        }
    }


}