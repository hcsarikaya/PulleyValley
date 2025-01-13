import * as THREE from 'three';

import { Door } from '../objects/Door.js';
import { Pulley } from '../objects/Pulley.js';
import { Rope } from '../objects/Rope.js';
import { Weight } from '../objects/Weight.js';
import levels from './levelConfig.json';
import {Button} from "../objects/Button.js";
import { Pallet } from '../objects/Pallet.js';
import {Boulder} from "../objects/Boulder.js";

export class Level{
    constructor(room, physicsWorld){
        this.room = room;
        this.scene = this.room.scene;
        this.objects=[];
        this.pos = this.room.position;
        this.physicsWorld = physicsWorld;

        /*
        if(this.pos === 0){
            this.doorIn = new Door(this.scene,this.physicsWorld, [0, 15, +25+this.pos ]);

        }
        this.doorOut = new Door(this.scene,this.physicsWorld, [0, 15, -25+this.pos ]);
        */
    }

    async addObject(level){

        const data = levels.levels[level].objects;
        for(let obj of data){
            await this.createObject(obj);
        }

    }


    async createObject(obj) {


        let object;
        let position;
        switch (obj.type) {
            case "pulley":
                position = obj.position;
                position[2] += this.pos;
                object = new Pulley(this.scene, this.physicsWorld, position, 1.5);
                await object.load();
                this.objects.push(object);
                break;
            case "weight":
                position = obj.position;
                position[2] += this.pos;
                const modelPath = obj.path;
                object = await Weight.create(this.scene,this.physicsWorld ,position, modelPath , obj.mass);
                //object = new Weight(this.scene, this.physicsWorld, position);

                this.objects.push(object);

                break;
            case "rope":
                /*
                const startObject = this.objects.find(o => o.id === obj.start);
                const endObject = this.objects.find(o => o.id === obj.end);

                if (startObject && endObject) {
                    object = new Rope(
                        this.scene,
                        this.physicsWorld,
                        {
                            startObject,
                            endObject,
                            segments: obj.segments || 20,
                            ropeColor: obj.ropeColor || 0x333333,
                            stiffness: obj.stiffness || 0.5,
                            damping: obj.damping || 0.99,
                            gravity: new THREE.Vector3(0, -9.8, 0),
                        }
                    );
                    this.objects.push(object);
                } else {
                    console.error("Invalid start or end object for rope:", obj);
                }

                 */
                break;
            case "button":
                position = obj.position
                position[2] += this.pos
                object = new Button(this.scene, position, obj.opt);
                this.objects.push(object);

                break
            case "pallet":
                position = obj.position;
                position[2] += this.pos;
                object = new Pallet(this.scene, this.physicsWorld, position, obj.scale || [1, 1, 1], obj.path);
                await object.load();
                this.objects.push(object);
                break
            case "boulder":
                position = obj.position;
                position[2] += this.pos;
                object = new Boulder(this.scene, this.physicsWorld, position,obj.scale || [1, 1, 1],);
                await object.load();
                this.objects.push(object);

                break
        }
    }


}