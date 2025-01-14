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
            vec2 dxy = pixelSize / resolution;
            vec2 pixelatedUv = vec2(
                floor(vUv.x / dxy.x) * dxy.x + dxy.x * 0.5,
                floor(vUv.y / dxy.y) * dxy.y + dxy.y * 0.5
            );
            
            // Sample the texture at the pixelated coordinates
            vec4 pixelatedColor = texture2D(tDiffuse, pixelatedUv);
            
            // Enhance brightness and contrast slightly
            vec3 color = pixelatedColor.rgb;
            color = pow(color, vec3(0.9)); // Reduce gamma slightly to brighten
            color *= 2.0; 

            // Add a small amount of the original color to maintain lighting detail
            vec4 originalColor = texture2D(tDiffuse, vUv);
            color = mix(color, originalColor.rgb, 0.2);
            
            // Ensure we don't exceed maximum brightness
            color = min(color, vec3(1.0));
            
            gl_FragColor = vec4(color, pixelatedColor.a);
        }
    `
}; 