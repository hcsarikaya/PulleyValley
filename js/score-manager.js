class ScoreManager {
    constructor() {
        // Initialize score tracking
        this.currentScore = 0;
        this.highScore = this.loadHighScore();
        this.multipliers = {
            efficiency: 1.0,
            speed: 1.0,
            complexity: 1.0
        };
    }

    // Calculate score based on level performance
    calculateLevelScore(levelData) {
        // Base score
        let score = 1000;

        // Efficiency multiplier (fewer pulleys = higher score)
        const efficiencyMultiplier = 1 / levelData.pulleyCount;
        score *= efficiencyMultiplier * this.multipliers.efficiency;

        // Speed multiplier (faster completion = higher score)
        const speedMultiplier = 1 / levelData.completionTime;
        score *= speedMultiplier * this.multipliers.speed;

        // Complexity bonus
        const complexityBonus = levelData.difficulty === 'Hard' ? 1.5 :
            levelData.difficulty === 'Medium' ? 1.2 : 1.0;
        score *= complexityBonus * this.multipliers.complexity;

        return Math.round(score);
    }

    // Add score
    addScore(points) {
        this.currentScore += points;
        this.updateHighScore();
    }

    // Update high score
    updateHighScore() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
        }
    }

    // Save high score to local storage
    saveHighScore() {
        try {
            localStorage.setItem('pulleyPuzzleHighScore', this.highScore);
        } catch (error) {
            console.error('Could not save high score', error);
        }
    }

    // Load high score from local storage
    loadHighScore() {
        try {
            return parseInt(localStorage.getItem('pulleyPuzzleHighScore')) || 0;
        } catch (error) {
            console.error('Could not load high score', error);
            return 0;
        }
    }

    // Reset score
    resetScore() {
        this.currentScore = 0;
    }

    // Get current score details
    getScoreDetails() {
        return {
            currentScore: this.currentScore,
            highScore: this.highScore
        };
    }
}