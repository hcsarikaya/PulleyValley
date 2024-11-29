function initMenuInteractions() {
    const homeMenu = document.getElementById('homeMenu');
    const startGameBtn = document.getElementById('startGame');
    const levelSelectBtn = document.getElementById('levelSelect');
    const settingsBtn = document.getElementById('settings');
    const creditsBtn = document.getElementById('credits');

    // Button Event Listeners
    startGameBtn.addEventListener('click', () => {
        homeMenu.style.display = 'none';
        // Transition to first game level
        console.log('Starting game...');
    });

    levelSelectBtn.addEventListener('click', () => {
        // Implement level selection menu
        alert('Level Select (To be implemented)');
    });

    settingsBtn.addEventListener('click', () => {
        // Implement settings menu
        alert('Settings (To be implemented)');
    });

    creditsBtn.addEventListener('click', () => {
        // Show credits
        alert('Pulley Puzzle\n\nCreated by [Your Team Name]\n\n© 2024');
    });
}