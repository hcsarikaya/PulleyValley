export  class InteractionManager {
    constructor(player, interactableObjects, thresholdDistance) {
        this.player = player;
        this.interactableObjects = interactableObjects;
        this.thresholdDistance = thresholdDistance;
    }

    checkInteractions() {
        for (const obj of this.interactableObjects) {
            const distance = this.player.position.distanceTo(obj.position);
            if (distance <= this.thresholdDistance) {
                console.log(`Player is close to ${obj.name || 'an interactable object'}`);
                this.handleInteraction(obj);
            }
        }
    }

    handleInteraction(obj) {
        if (obj.name === 'door') {
            console.log('Opening the door...');
            // Add logic to open the door
        } else if (obj.name === 'item') {
            console.log('Picking up the item...');

        }
    }
}