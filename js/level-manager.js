class LevelManager {
    constructor() {
        this.levels = [
            {
                id: 1,
                name: "Tutorial: Basic Pulleys",
                description: "Learn fundamental pulley mechanics",
                difficulty: "Easy",
                objects: [
                    {
                        type: "weight",
                        mass: 10,
                        initialPosition: [0, 0, 0]
                    },
                    {
                        type: "pulley",
                        position: [1, 0, 0],
                        maxLoad: 15
                    }
                ],
                objectives: [
                    "Lift the weight 2 meters",
                    "Use minimal pulley configurations"
                ],
                completionCriteria: {
                    weightLifted: 2,
                    maxPulleysAllowed: 2
                }
            },
            {
                id: 2,
                name: "Industrial Challenge",
                description: "Complex mechanical system",
                difficulty: "Medium",
                objects: [
                    {
                        type: "weight",
                        mass: 20,
                        initialPosition: [0, 0, 0]
                    },
                    {
                        type: "pulley",
                        position: [1, 0, 0],
                        maxLoad: 25
                    },
                    {
                        type: "pulley",
                        position: [-1, 0, 0],
                        maxLoad: 25
                    }
                ],
                objectives: [
                    "Balance multiple weights",
                    "Create an efficient lifting mechanism"
                ],
                completionCriteria: {
                    weightLifted: 4,
                    maxPulleysAllowed: 3
                }
            }
        ];

        this.currentLevel = null;
    }

    // Load a specific level by ID
    loadLevel(levelId) {
        const level = this.levels.find(l => l.id === levelId);
        if (!level) {
            console.error(`Level ${levelId} not found`);
            return null;
        }

        this.currentLevel = level;
        this.setupLevelObjects();
        this.displayLevelInfo();

        return level;
    }

    // Setup objects for the current level
    setupLevelObjects() {
        if (!this.currentLevel) return;

        // Create level objects based on configuration
        this.currentLevel.objects.forEach(object => {
            // Logic to instantiate objects in the scene
            // This would interact with your object manager
            console.log(`Setting up ${object.type} at ${object.position}`);
        });
    }

    // Display current level information
    displayLevelInfo() {
        const infoPanel = document.getElementById('levelInfo') ||
            document.createElement('div');

        infoPanel.id = 'levelInfo';
        infoPanel.innerHTML = `
            <h2>${this.currentLevel.name}</h2>
            <p>${this.currentLevel.description}</p>
            <h3>Objectives:</h3>
            <ul>
                ${this.currentLevel.objectives.map(obj => `<li>${obj}</li>`).join('')}
            </ul>
        `;

        document.body.appendChild(infoPanel);
    }

    // Check if level objectives are completed
    checkLevelCompletion(gameState) {
        if (!this.currentLevel) return false;

        const criteria = this.currentLevel.completionCriteria;

        // Example completion check
        const isWeightLifted = gameState.weightHeight >= criteria.weightLifted;
        const isPulleyCountValid = gameState.pulleyCount <= criteria.maxPulleysAllowed;

        return isWeightLifted && isPulleyCountValid;
    }

    // Progress to next level
    advanceToNextLevel() {
        const currentIndex = this.levels.findIndex(l => l.id === this.currentLevel.id);
        if (currentIndex < this.levels.length - 1) {
            return this.loadLevel(this.levels[currentIndex + 1].id);
        }
        return null;
    }
}