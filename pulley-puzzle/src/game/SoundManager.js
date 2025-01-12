export default class SoundManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.activeSounds = {};
        this.loadSounds(); // Ensure sounds are loaded upon instantiation
    }

    // Preload all your audio assets
    loadSounds() {
        // Example using HTMLAudioElement:
        this.sounds.walk = new Audio('/src/sounds/Walking_Realistic_fo.mp3');
        this.sounds.walk.loop = true;
        this.sounds.walk.volume = 0.5;

        this.sounds.run = new Audio('/src/sounds/Running_Fast-paced_f.mp3');
        this.sounds.run.loop = true;
        this.sounds.run.volume = 0.5;

        this.sounds.dash = new Audio('/src/sounds/Dashing_in_Air_Whoos.mp3');
        this.sounds.dash.loop = false; // One-time sound
        this.sounds.dash.volume = 0.2;

        this.sounds.jump = new Audio('/src/sounds/Jumping_Sound_of_a_p.mp3');
        this.sounds.jump.volume = 1.0;

        this.sounds.nextLevel = new Audio('/src/sounds/next level.mp3');
        this.sounds.nextLevel.volume = 0.5;

        // Background music
        this.music = new Audio('/src/sounds/minecraft-starting-song.mp3');
        this.music.loop = true;
        this.music.volume = 0.0;

        // Load other sounds if needed:
        // this.sounds.objectAdd = new Audio('/src/sounds/objectAdd.mp3');
        // this.sounds.objectRemove = new Audio('/src/sounds/objectRemove.mp3');
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
            this.music.currentTime = 0; // Rewind
        }
    }

    // Play a one-time sound effect by name
    playSound(name) {
        if (!this.sounds[name]) return;
        const sound = this.sounds[name].cloneNode();
        // Inherit volume and mute state
        sound.volume = this.sounds[name].volume;
        sound.muted = this.sounds[name].muted;
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

    // Mute a specific sound
    muteSound(name) {
        if (this.sounds[name]) {
            this.sounds[name].muted = true;
        }
    }

    // Unmute a specific sound
    unmuteSound(name) {
        if (this.sounds[name]) {
            this.sounds[name].muted = false;
        }
    }

    // Additional helpers could go here...
    // For example: fade in/out, toggling global mute, etc.
}
