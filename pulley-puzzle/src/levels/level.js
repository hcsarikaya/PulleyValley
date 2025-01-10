import * as THREE from 'three';

import { Door } from '../objects/Door.js';
import { Pulley } from '../objects/Pulley.js';
import { Rope } from '../objects/Rope.js';
import { Weight } from '../objects/Weight.js';
import levels from './levelConfig.json';
import {Button} from "../objects/Button.js";

export class Level{
    constructor(room, physicsWorld){
        this.room = room;
        this.scene = this.room.scene;
        this.objects=[];
        this.pos = this.room.position;
        this.physicsWorld = physicsWorld;


        if(this.pos == 0){
            this.doorIn = new Door(this.scene,this.physicsWorld, [0, 15, +25+this.pos ]);

        }
        this.doorOut = new Door(this.scene,this.physicsWorld, [0, 15, -25+this.pos ]);

    }

    addObject(level){

        const data = levels.levels[level].objects;
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

                object = new Rope(this.scene,this.physicsWorld ,this.objects[0],this.objects[1], 10);
                this.objects.push(object);

                break
            case "button":
                position = obj.position
                position[2] += this.pos
                object = new Button(this.scene, position, obj.opt);
                this.objects.push(object);

                break
        }
    }


}