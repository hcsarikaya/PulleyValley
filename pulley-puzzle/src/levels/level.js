import * as THREE from 'three';

import { Door } from '../objects/Door.js';
import { Pulley } from '../objects/Pulley.js';
import { Rope } from '../objects/Rope.js';
import { Weight } from '../objects/Weight.js';
import levels from './levelConfig.json';
import {Button} from "../objects/Button.js";
import { Pallet } from '../objects/Pallet.js';
import {Boulder} from "../objects/Boulder.js";
import { TriggerZone } from '../controls/TriggerZone.js';

export class Level{
    constructor(room, physicsWorld){
        this.room = room;
        this.scene = this.room.scene;
        this.objects=[];
        this.pos = this.room.position;
        this.physicsWorld = physicsWorld;
        this.triggerZones = [];

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
                if(obj.id){
                    object.name = obj.id;
                }
                this.objects.push(object);

                console.log(object);

                break;
            case "weight":
                position = obj.position;
                position[2] += this.pos;
                const modelPath = obj.path;
                object = await Weight.create(this.scene, this.physicsWorld, position, modelPath, obj.mass);
                this.objects.push(object);
                break;
            case "rope":
                const startPos = new THREE.Vector3(obj.start[0], obj.start[1], obj.start[2]);
                const endPos = new THREE.Vector3(obj.end[0], obj.end[1], obj.end[2]);

                if (startPos && endPos) {
                    object = new Rope(this.scene, {
                        startPosition: startPos,
                        endPosition: endPos,
                        segments: obj.segments || 10,
                        ropeColor: 0xff0000,
                        type: obj.ropeType || 'static'
                    });
                    if(obj.id) {
                        object.name = obj.id;
                    }
                    this.objects.push(object);
                }


                break;
            case "button":
                position = obj.position
                position[2] += this.pos
                object = new Button(this.scene,this.physicsWorld, position, obj.opt);
                this.objects.push(object);

                break
            case "pallet":
                position = obj.position;
                position[2] += this.pos;
                object = new Pallet(this.scene, this.physicsWorld, position, obj.scale || [1, 1, 1], obj.path);
                await object.load();
                if(obj.id){
                    object.name = obj.id;
                }
                console.log(object)
                this.objects.push(object);
                break
            case "boulder":
                position = obj.position;
                position[2] += this.pos;
                object = new Boulder(this.scene, this.physicsWorld, position,obj.scale || [1, 1, 1],obj.path,obj.mass);
                await object.load();
                if(obj.id){
                    object.name = obj.id;
                }
                console.log(object)
                this.objects.push(object);

                break
            case "triggerZone":
                position = obj.position;
                position[2] += this.pos;
                object = new TriggerZone(
                    this.scene,
                    new THREE.Vector3(position[0], position[1], position[2]),
                    new THREE.Vector3(obj.size[0], obj.size[1], obj.size[2]),
                    (intersectingObject) => {
                        if (obj.triggerType === "levelComplete") {
                            console.log("Level complete triggered by:", intersectingObject);
                        }
                    }
                );
                this.triggerZones.push(object);
                break;
        }
    }

    
}
