// src/ui/InventoryUI.js

import Inventory from '../game/Inventory.js';

export default class InventoryUI {
    constructor(containerId = 'inventory-hotbar') {
        this.container = document.getElementById(containerId);
        this.inventory = new Inventory();
        this.selectedSlot = 0; // Default to the first slot being selected

        this.render();
        this.setupMouseScroll();
    }

    render() {
        // Clear the container
        this.container.innerHTML = '';

        // Create a slot for each item in the inventory
        this.inventory.items.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.classList.add('inventory-slot');
            if (index === this.selectedSlot) {
                slot.classList.add('selected'); // Highlight selected slot
            }
            slot.textContent = item ? item.name : 'Empty';
            this.container.appendChild(slot);

            // Add hover or click listeners if needed
            slot.addEventListener('click', () => {
                console.log(`Clicked on slot ${index}`);
            });
        });
    }

    setupMouseScroll() {
        // Add mouse wheel event listener to the document or a specific element
        window.addEventListener('wheel', (event) => {
            // Normalize wheel delta (up or down)
            const delta = Math.sign(event.deltaY);

            // Update the selected slot based on scroll direction
            if (delta > 0) {
                this.selectedSlot = (this.selectedSlot + 1) % this.inventory.slots;
            } else if (delta < 0) {
                this.selectedSlot = (this.selectedSlot - 1 + this.inventory.slots) % this.inventory.slots;
            }

            this.render(); // Re-render to update the highlight
        });
    }
}
