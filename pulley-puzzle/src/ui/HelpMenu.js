// src/ui/HelpMenu.js

export default class HelpMenu {
    constructor() {
        // Create a container element for the help text
        this.container = document.createElement('div');
        this.container.id = 'helpMenu';

        // You can fill this with whatever help text or instructions you like.
        this.container.innerHTML = `
          <h2>Help</h2>
          <p>Controls:</p>
          <ul>
            <li>W/A/S/D to move</li>
            <li>Space to jump</li>
            <li>Shift to run</li>
            <li>Ctrl to dash</li>
            <li>Left click to interact with objects</li>
            <li>F to toggle free fly mode</li>
            <li>P to move origin</li>
            <li>L to open the settings menu</li>
            <li>B to enable edit mode</li>
            <li>U to set current level to 1</li>
            <li>i to set current level to 2</li>
            <li>O to set current level to 3</li>
            <li>K to toggle light</li>
            <li>1 to night vision</li>
            <li>2 to lose sanity</li>
            <li>H to toggle this help menu</li>
            
            
          </ul>
        `;


        // Initially hidden
        this.isVisible = false;
        this.hide();

        // Add to document body
        document.body.appendChild(this.container);
    }

    show() {
        this.container.style.display = 'block';
        this.isVisible = true;
    }

    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}
