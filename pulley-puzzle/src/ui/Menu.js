export function initMenu(startGameCallback) {
    const startGameBtn = document.getElementById('start-game-btn');
    const instructionsBtn = document.getElementById('instructions-btn');
    const exitBtn = document.getElementById('exit-btn');
    const levelButtons = document.querySelectorAll('.level-btn');
    const mainMenu = document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');

    function showInstructions() {
        alert('Instructions:\n\n1. Use arrow keys to rotate the pulley.\n2. Move the weight to the target zone.');
    }

    function exitGame() {
        alert('Thank you for playing!');
    }

    function loadLevel(event) {
        const level = event.target.getAttribute('data-level');
        mainMenu.style.display = 'none';
        gameContainer.style.display = 'block';
        startGameCallback(level);
    }

    startGameBtn.addEventListener('click', () => {
        document.getElementById('level-selection').style.display = 'block';
    });
    instructionsBtn.addEventListener('click', showInstructions);
    exitBtn.addEventListener('click', exitGame);
    levelButtons.forEach((button) => button.addEventListener('click', loadLevel));
}
