// Level.js
import * as THREE from 'three';
import { Door } from '../objects/Door.js';
import { Pulley } from '../objects/Pulley.js';
import { Rope } from '../objects/Rope.js';
import { Weight } from '../objects/Weight.js';
import levels from './levelConfig.json';

export class Level {
    constructor(room, physicsWorld) {
        this.room = room;
        this.scene = this.room.scene;
        this.objects = [];
        this.pos = this.room.position;
        this.physicsWorld = physicsWorld; // store it here

        if(this.pos === 0) {
            this.doorIn = new Door(this.scene, physicsWorld, [0, 15, -24 + this.pos]);
        }
        this.doorOut = new Door(this.scene, physicsWorld, [0, 15, 24 + this.pos]);
    }

    addObject(level) {
        const data = levels.levels[level - 1].objects;
        data.forEach(obj => {
            this.createObject(obj);
        });
    }

    createObject(obj) {
        let object;
        let position = obj.position;

        if (position) {
            position[2] += this.pos; // Adjust for room position
        }

        switch (obj.type) {
            case 'pulley':
                object = new Pulley(this.scene, this.physicsWorld, position);
                break;

            case 'weight':
                object = new Weight(this.scene, this.physicsWorld, position);
                break;

            case 'rope':
                object = new Rope(this.scene, this.physicsWorld, position);
                break;

            default:
                console.warn(`Unknown object type: ${obj.type}`);
        }

        if (object) {
            this.objects.push(object);
        }
    }

}
