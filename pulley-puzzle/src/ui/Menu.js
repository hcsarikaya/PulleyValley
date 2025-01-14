export function initMenu(startGameCallback) {
    const startGameBtn = document.getElementById('start-game-btn');
    const instructionsBtn = document.getElementById('instructions-btn');
    const exitBtn = document.getElementById('exit-btn');
    const mainMenu = document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');

    // Get modal elements
    const instructionsModal = document.getElementById('instructions-modal');
    const closeBtn = instructionsModal.querySelector('.close-btn');

    // Function to show instructions modal
    function showInstructions() {
        instructionsModal.style.display = 'block';
    }

    // Function to close instructions modal
    function closeInstructions() {
        instructionsModal.style.display = 'none';
    }

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
    instructionsBtn.addEventListener('click', showInstructions);
    exitBtn.addEventListener('click', exitGame);

    // Close modal when close button is clicked
    closeBtn.addEventListener('click', closeInstructions);

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === instructionsModal) {
            closeInstructions();
        }
    });
}
