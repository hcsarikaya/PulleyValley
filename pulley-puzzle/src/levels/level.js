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
            this.doorIn = new Door(this.scene, [0, 15, -25 + this.pos]);
        }
        this.doorOut = new Door(this.scene, [0, 15, 25 + this.pos]);
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

        // Adjust for room's position offset
        if (position) {
            position[2] += this.pos;
        }

        switch (obj.type) {
            case "pulley":
                object = new Pulley(this.scene, position);
                this.objects.push(object);
                break;
            case "weight":
                object = new Weight(this.scene, position);
                this.objects.push(object);
                break;
            case "rope":
                // Now we can pass this.physicsWorld into Rope
                // Possibly you need startPos, endPos, etc.
                object = new Rope(this.scene, this.physicsWorld, position);
                this.objects.push(object);
                break;
        }
    }
}
