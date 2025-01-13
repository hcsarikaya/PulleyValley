import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Loads a 3D model using GLTFLoader.
 * @param {string} modelPath - Path to the model file (e.g., .glb or .gltf).
 * @returns {Promise<THREE.Group>} A Promise that resolves with the loaded 3D model (THREE.Group).
 */
export async function loadModel(modelPath) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();

        loader.load(
            modelPath,
            (gltf) => {
                const model = gltf.scene;
                resolve(model); // Successfully loaded the model
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
                reject(error); // Reject the promise on error
            }
        );
    });
}