#version 300 es
precision highp float;

uniform float uTime;

in vec4 vColor;
in vec2 vUV;

out vec4 fragColor;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Noise function
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth interpolation using cubic
    vec2 u = f * f * (3.0 - 2.0 * f);

    // Mix 4 corners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

void main() {
    // Create dynamic background with noise and color variation
    float noiseValue = noise(vUV * 10.0 + uTime * 0.1);

    // Create color variation based on noise and time
    vec3 dynamicColor = vColor.rgb * (0.5 + noiseValue * 0.5);

    // Add subtle pulsing effect
    float pulse = sin(uTime * 2.0) * 0.1 + 0.9;

    fragColor = vec4(dynamicColor * pulse, vColor.a);
}