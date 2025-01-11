//Daha kullanilmiyor texture ekliceksen yenilemem lazim

export const GlowShader = {
    uniforms: {
        time: { value: 0 },
        maxDist: { value: 0.866 }
    },
    vertexShader: /* glsl */`
    varying vec3 vPosition;

    void main() {
      // Pass position in object space to the fragment shader
      vPosition = position;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: /* glsl */`
    uniform float time;
    uniform float maxDist;
    varying vec3 vPosition;

    void main() {
      // Distance from center of the box (0,0,0) in object space
      float dist = length(vPosition);

      // A radial factor that is 1.0 at center, 0.0 near edges
      // smoothstep(edge0, edge1, x) -> transitions from 0 to 1
      float radial = 1.0 - smoothstep(0.0, maxDist, dist);
      // radial is highest at dist=0, and near 0 at dist >= maxDist

      // Flicker factor: combines time and distance for a sparkly effect
      float flicker = sin(time * 20.0 + dist * 10.0) * 0.5 + 0.5;
      // flicker goes between 0..1

      // Combine radial + flicker
      // The 0.5 scaling is optional; tweak for more or less effect
      float intensity = radial * 0.5 + (radial * flicker * 0.5);

      // Glow color (yellowish)
      vec3 glowColor = vec3(1.0, 0.9, 0.2);

      // Final color scales with intensity
      vec3 finalColor = glowColor * intensity;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};
