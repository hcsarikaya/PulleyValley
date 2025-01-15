export function initMenu(startGameCallback) {
    const startGameBtn = document.getElementById('start-game-btn');
    const instructionsBtn = document.getElementById('instructions-btn');
    const exitBtn = document.getElementById('exit-btn');
    const mainMenu = document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');


    // Function to handle exit game
    function exitGame() {
        alert('Thank you for playing!');
    }

    // Function to start game
    function startGame() {
        mainMenu.style.display = 'none';
        gameContainer.style.display = 'block';
        startGameCallback(1); // Start with level 1 by default
    }

    // Event listeners
    startGameBtn.addEventListener('click', startGame);

    exitBtn.addEventListener('click', exitGame);




}
