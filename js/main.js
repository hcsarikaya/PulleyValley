// Main WebGL Initialization
let gl;
let canvas;

async function initWebGL() {
    // Get canvas and WebGL context
    canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error('WebGL 2.0 not supported');
        return null;
    }

    // Resize and setup viewport
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // Initial resize and add resize listener
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return gl;
}

// Initialize application
async function initApp() {
    try {
        // Initialize WebGL
        const gl = await initWebGL();
        if (!gl) return;

        // Initialize background
        await initBackground(gl);

        // Initialize menu interactions
        initMenuInteractions();
    } catch (error) {
        console.error('Application initialization error:', error);
    }
}

// Start application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);