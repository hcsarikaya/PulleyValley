// src/game/Inventory.js

export default class Inventory {
    constructor(slots = 9) {
        this.slots = slots;
        this.items = new Array(slots).fill(null);
    }

    addItem(item, slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots) return false;
        this.items[slotIndex] = item;
        return true;
    }

    removeItem(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots) return null;
        const removed = this.items[slotIndex];
        this.items[slotIndex] = null;
        return removed;
    }

    getItem(slotIndex) {
        return this.items[slotIndex];
    }
}
