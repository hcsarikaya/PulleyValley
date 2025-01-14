export default class SettingsMenu {
    constructor(soundManager, onMouseSensitivityChange) {
        this.soundManager = soundManager;
        this.onMouseSensitivityChange = onMouseSensitivityChange; // Callback function
        this.isVisible = false;
        this.container = null;
        this.#createDOM();
    }

    #createDOM() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.padding = '20px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.color = '#fff';
        this.container.style.display = 'none';  // Start hidden
        this.container.style.flexDirection = 'column';
        this.container.style.zIndex = '9999';
        this.container.style.minWidth = '200px';
        this.container.style.borderRadius = '8px';
        this.container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';

        const title = document.createElement('h2');
        title.textContent = 'Settings';
        title.style.marginTop = '0';
        title.style.textAlign = 'center';
        this.container.appendChild(title);

        const musicContainer = document.createElement('div');
        musicContainer.style.margin = '10px 0';
        musicContainer.style.display = 'flex';
        musicContainer.style.alignItems = 'center';

        const musicLabel = document.createElement('label');
        musicLabel.textContent = 'Music Volume: ';
        musicLabel.style.flex = '1';
        musicLabel.style.marginRight = '10px';
        musicContainer.appendChild(musicLabel);

        const musicVolume = document.createElement('input');
        musicVolume.type = 'range';
        musicVolume.min = '0';
        musicVolume.max = '1';
        musicVolume.step = '0.01';
        musicVolume.value = this.soundManager.music.volume;
        musicVolume.style.flex = '2';
        musicVolume.addEventListener('input', (e) => {
            const newVolume = parseFloat(e.target.value);
            this.soundManager.music.volume = newVolume;
        });
        musicContainer.appendChild(musicVolume);
        this.container.appendChild(musicContainer);

        const sensitivityContainer = document.createElement('div');
        sensitivityContainer.style.margin = '10px 0';
        sensitivityContainer.style.display = 'flex';
        sensitivityContainer.style.alignItems = 'center';

        const sensitivityLabel = document.createElement('label');
        sensitivityLabel.textContent = 'Mouse Sensitivity: ';
        sensitivityLabel.style.flex = '1';
        sensitivityLabel.style.marginRight = '10px';
        sensitivityContainer.appendChild(sensitivityLabel);

        const sensitivitySlider = document.createElement('input');
        sensitivitySlider.type = 'range';
        sensitivitySlider.min = '0.001';
        sensitivitySlider.max = '0.01';
        sensitivitySlider.step = '0.001';
        sensitivitySlider.value = this.onMouseSensitivityChange.currentValue || '0.002'; // Default value
        sensitivitySlider.style.flex = '2';
        sensitivitySlider.addEventListener('input', (e) => {
            const newSensitivity = parseFloat(e.target.value);
            if (typeof this.onMouseSensitivityChange === 'function') {
                this.onMouseSensitivityChange(newSensitivity);
            }
        });
        sensitivityContainer.appendChild(sensitivitySlider);
        this.container.appendChild(sensitivityContainer);

        document.body.appendChild(this.container);
    }

    show() {
        this.container.style.display = 'flex';
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
