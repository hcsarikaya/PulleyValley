#version 300 es
precision highp float;

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec4 aColor;

uniform float uTime;  // Time passed since start
uniform vec2 uResolution;  // Viewport resolution

out vec4 vColor;
out vec2 vUV;

void main() {
    // Create wave-like movement
    vec3 animatedPosition = aPosition;
    animatedPosition.x += sin(uTime + aPosition.y * 5.0) * 0.1;
    animatedPosition.y += cos(uTime + aPosition.x * 5.0) * 0.1;

    // Calculate normalized position
    gl_Position = vec4(animatedPosition, 1.0);

    // Pass color and UV coordinates
    vColor = aColor;
    vUV = (aPosition.xy + 1.0) * 0.5;  // Map to 0-1 range
}