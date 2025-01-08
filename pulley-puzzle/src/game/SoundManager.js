export default class SoundManager {
    constructor() {
        // Store references to audio elements or buffers
        this.sounds = {};
        this.music = null;
        this.activeSounds = {}; // Track currently playing looping sounds
    }

    // Preload all your audio assets
    loadSounds() {
        // Example using HTMLAudioElement:
        this.sounds.walk = new Audio('/src/sounds/minecraft-grass-walking-sound-effect.mp3');
        this.sounds.walk.loop = true; // Loop walking sound
        this.sounds.walk.volume = 0.7; // Adjust volume as needed

        this.sounds.jump = new Audio('/src/sounds/bow_shoot.mp3');
        this.sounds.jump.volume = 0.7;

        // Background music
        this.music = new Audio('/src/sounds/minecraft-starting-song.mp3');
        this.music.loop = true; // typical for background music
        this.music.volume = 0.1; // set desired volume

        // Load other sounds as needed
        // this.sounds.objectAdd = new Audio('assets/sounds/objectAdd.mp3');
        // this.sounds.objectRemove = new Audio('assets/sounds/objectRemove.mp3');
    }

    // Play background music
    playMusic() {
        if (this.music && this.music.paused) {
            this.music.play();
        }
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0; // rewind
        }
    }

    // Play a one-time sound effect by name
    playSound(name) {
        if (!this.sounds[name]) return;
        // Clone the audio element to allow overlapping sounds
        const sound = this.sounds[name].cloneNode();
        sound.play();
    }

    // Play a looping sound effect by name
    playLoop(name) {
        if (!this.sounds[name]) return;
        if (this.activeSounds[name]) return; // Already playing

        this.activeSounds[name] = this.sounds[name];
        this.activeSounds[name].play();
    }

    // Stop a looping sound effect by name
    stopLoop(name) {
        if (this.activeSounds[name]) {
            this.activeSounds[name].pause();
            this.activeSounds[name].currentTime = 0;
            delete this.activeSounds[name];
        }
    }

    // For advanced usage, add methods to pause sounds, fade volumes, etc.
    // ...
}
