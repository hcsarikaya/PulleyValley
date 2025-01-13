export const NightVisionShader = {
    uniforms: {
        "tDiffuse": { value: null },  
        "time": { value: 0.0 },       
        "intensity": { value: 1.0 }    
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
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;

        // Noise function
        float random(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            
            // Convert to luminance and enhance base brightness
            float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
            luminance = luminance * 2.0 + 0.0; // Increase base brightness
            
            // Enhance contrast but maintain brightness
            luminance = pow(luminance, 0.7); 
            
            vec2 noiseCoord = vUv + time * 0.01;
            float noise = random(noiseCoord) * 0.1;
            
            // Create brighter green night vision color
            vec3 nightVision = vec3(0.1, luminance, 0.1) + vec3(0.0, noise, 0.0);
            
            // Add enhanced bright areas bloom
            float bloom = smoothstep(0.6, 1.0, luminance) * 0.7; // Increased bloom intensity
            nightVision += vec3(0.0, bloom, 0.0);
            
            // Softer vignette effect
            vec2 center = vec2(0.5, 0.5);
            float dist = length(vUv - center);
            float vignette = smoothstep(0.7, 0.2, dist); // Increased outer radius from 0.5 to 0.7
            nightVision *= vignette;

            // Add minimum brightness to ensure visibility
            nightVision += vec3(0.0, 0.15, 0.0);

            vec3 finalColor = mix(texel.rgb, nightVision, intensity);
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
}; 
