import * as THREE from 'three';

export const PixelationShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "pixelSize": { value: 8.0 },  // Size of each pixel block
        "resolution": { 
            value: new THREE.Vector2(window.innerWidth, window.innerHeight)
        }
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform float pixelSize;
        uniform vec2 resolution;
        varying vec2 vUv;

        void main() {
            // Calculate the pixel grid
            vec2 pixels = resolution.xy / pixelSize;
            
            // Calculate the pixel coordinate
            vec2 pixelCoord = floor(vUv * pixels) / pixels;
            
            // Sample the texture at the pixelated coordinate
            vec4 color = texture2D(tDiffuse, pixelCoord);
            
            // Output the pixelated color
            gl_FragColor = color;
        }
    `
}; 