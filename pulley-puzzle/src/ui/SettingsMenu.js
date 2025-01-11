export default class SettingsMenu {
    constructor(soundManager) {
        this.soundManager = soundManager;
        this.isVisible = false;
        this.container = null;
        this.#createDOM();
    }

    #createDOM() {
        // Create a container for the settings menu
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

        // Title
        const title = document.createElement('h2');
        title.textContent = 'Settings';
        title.style.marginTop = '0';
        this.container.appendChild(title);

        // --- Example Setting: Music Volume ---
        const musicContainer = document.createElement('div');
        musicContainer.style.margin = '10px 0';

        const musicLabel = document.createElement('label');
        musicLabel.textContent = 'Music Volume: ';
        musicLabel.style.display = 'inline-block';
        musicLabel.style.width = '120px';
        musicContainer.appendChild(musicLabel);

        const musicVolume = document.createElement('input');
        musicVolume.type = 'range';
        musicVolume.min = '0';
        musicVolume.max = '1';
        musicVolume.step = '0.1';
        musicVolume.value = this.soundManager.music.volume;
        musicVolume.addEventListener('input', (e) => {
            // Adjust background music volume
            const newVolume = parseFloat(e.target.value);
            this.soundManager.music.volume = newVolume;
        });
        musicContainer.appendChild(musicVolume);
        this.container.appendChild(musicContainer);

        // --- Example Setting: Mute/Unmute Entire Game ---
        const muteContainer = document.createElement('div');
        muteContainer.style.margin = '10px 0';

        const muteLabel = document.createElement('label');
        muteLabel.textContent = 'Mute All Sounds: ';
        muteLabel.style.display = 'inline-block';
        muteLabel.style.width = '120px';
        muteContainer.appendChild(muteLabel);

        const muteCheckbox = document.createElement('input');
        muteCheckbox.type = 'checkbox';
        muteCheckbox.checked = false; // default
        muteCheckbox.addEventListener('change', (e) => {
            const shouldMute = e.target.checked;
            this.#muteAll(shouldMute);
        });
        muteContainer.appendChild(muteCheckbox);
        this.container.appendChild(muteContainer);

        // You can add more sliders/checks for run/walk/dash volumes, etc.

        // Append container to body
        document.body.appendChild(this.container);
    }

    /**
     * Mute/Unmute all known sounds
     */
    #muteAll(isMute) {
        // Mute or unmute the background music
        this.soundManager.music.muted = isMute;

        // Mute or unmute all loaded sounds
        for (let soundKey in this.soundManager.sounds) {
            this.soundManager.sounds[soundKey].muted = isMute;
        }
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
