let backgroundProgram;
let backgroundVertexBuffer;
let backgroundColorBuffer;

async function initBackground(gl) {
    // Load vertex and fragment shaders
    const vertexShaderSource = await WebGLUtils.loadShader('shaders/vertex/background-vertex.glsl');
    const fragmentShaderSource = await WebGLUtils.loadShader('shaders/fragment/background-fragment.glsl');

    // Create shaders
    const vertexShader = WebGLUtils.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = WebGLUtils.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Create program
    backgroundProgram = WebGLUtils.createProgram(gl, vertexShader, fragmentShader);

    // Create background particles
    const backgroundVertices = [];
    const backgroundColors = [];

    for (let i = 0; i < 500; i++) {
        // Random 3D positions
        backgroundVertices.push(
            Math.random() * 2 - 1,  // x
            Math.random() * 2 - 1,  // y
            Math.random() * 2 - 1   // z
        );

        // Random pastel colors
        backgroundColors.push(
            0.5 + Math.random() * 0.5,  // R
            0.5 + Math.random() * 0.5,  // G
            0.5 + Math.random() * 0.5,  // B
            0.3  // Alpha
        );
    }

    // Create buffers
    backgroundVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, backgroundVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(backgroundVertices), gl.STATIC_DRAW);

    backgroundColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, backgroundColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(backgroundColors), gl.STATIC_DRAW);
}

function renderBackground(gl) {
    gl.useProgram(backgroundProgram);

    // Rendering logic will be added here
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    requestAnimationFrame(() => renderBackground(gl));
}