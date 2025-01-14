export default class HelpMenu {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'helpMenu';

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
            <li>H to toggle this help menu</li>
            
          </ul>
        `;


        this.isVisible = false;
        this.hide();

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
