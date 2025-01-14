export const woodVertexShader = /* glsl */`
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    // Compute world-space position
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosition = worldPos.xyz;
    
    // Pass the normal to fragment shader
    vNormal = normalMatrix * normal;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    // Standard final position
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const woodFragmentShader = /* glsl */`
precision highp float;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

// Light properties
struct SpotLight {
    vec3 position;
    vec3 direction;
    vec3 color;
    float distance;
    float decay;
    float coneCos;
    float penumbraCos;
    float intensity;
    bool visible;
};

uniform SpotLight spotLights[2];

vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}

float noise3D(vec3 P){
    vec3 i0=mod289(floor(P)); vec3 i1=mod289(i0+vec3(1.0));
    vec3 f0=fract(P); vec3 f1=f0-vec3(1.0); vec3 f=fade(f0);
    vec4 ix=vec4(i0.x,i1.x,i0.x,i1.x); vec4 iy=vec4(i0.yy,i1.yy);
    vec4 iz0=i0.zzzz; vec4 iz1=i1.zzzz;
    vec4 ixy=permute(permute(ix)+iy);
    vec4 ixy0=permute(ixy+iz0); vec4 ixy1=permute(ixy+iz1);
    vec4 gx0=ixy0*(1.0/7.0); vec4 gy0=fract(floor(gx0)*(1.0/7.0))-0.5;
    vec4 gx1=ixy1*(1.0/7.0); vec4 gy1=fract(floor(gx1)*(1.0/7.0))-0.5;
    gx0=fract(gx0); gx1=fract(gx1);
    vec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0); vec4 sz0=step(gz0,vec4(0.0));
    vec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1); vec4 sz1=step(gz1,vec4(0.0));
    gx0-=sz0*(step(0.0,gx0)-0.5);gy0-=sz0*(step(0.0,gy0)-0.5);
    gx1-=sz1*(step(0.0,gx1)-0.5);gy1-=sz1*(step(0.0,gy1)-0.5);
    vec3 g0=vec3(gx0.x,gy0.x,gz0.x); vec3 g1=vec3(gx0.y,gy0.y,gz0.y);
    vec3 g2=vec3(gx0.z,gy0.z,gz0.z); vec3 g3=vec3(gx0.w,gy0.w,gz0.w);
    vec3 g4=vec3(gx1.x,gy1.x,gz1.x); vec3 g5=vec3(gx1.y,gy1.y,gz1.y);
    vec3 g6=vec3(gx1.z,gy1.z,gz1.z); vec3 g7=vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0=taylorInvSqrt(vec4(dot(g0,g0),dot(g2,g2),dot(g1,g1),dot(g3,g3)));
    vec4 norm1=taylorInvSqrt(vec4(dot(g4,g4),dot(g6,g6),dot(g5,g5),dot(g7,g7)));
    g0*=norm0.x; g2*=norm0.y; g1*=norm0.z; g3*=norm0.w;
    g4*=norm1.x; g6*=norm1.y; g5*=norm1.z; g7*=norm1.w;
    vec4 nz=mix(
        vec4(dot(g0,f0),dot(g1,vec3(f1.x,f0.y,f0.z)),dot(g2,vec3(f0.x,f1.y,f0.z)),dot(g3,vec3(f1.x,f1.y,f0.z))),
        vec4(dot(g4,vec3(f0.x,f0.y,f1.z)),dot(g5,vec3(f1.x,f0.y,f1.z)),dot(g6,vec3(f0.x,f1.y,f1.z)),dot(g7,vec3(f1.x,f1.y,f1.z))),
        f.z
    );
    return 2.2*mix(mix(nz.x,nz.z,f.y),mix(nz.y,nz.w,f.y),f.x);
}

float noise2D(vec2 p){
    return noise3D(vec3(p,0.0));
}

void main() {
    // Wood grain calculation
    float scale = 1.0; 
    float nx = vPosition.x * scale;
    float ny = vPosition.z * scale; 

    float val = noise2D(vec2(nx, ny));
    val = 0.5 + 0.5 * val; // [-1..1] to [0..1]

    float ringFactor = val * 10.0;
    float ring = fract(ringFactor);

    vec3 woodDark = vec3(0.345, 0.17, 0.07);
    vec3 woodLight = vec3(0.67, 0.52, 0.33);
    vec3 baseColor = mix(woodDark, woodLight, ring);

    // Lighting calculation
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Reduced ambient light even further for darker appearance
    float ambientStrength = 0.05;
    vec3 ambient = ambientStrength * baseColor;
    
    // Calculate lighting from both spotlights
    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);
    
    for(int i = 0; i < 2; i++) {
        if (spotLights[i].visible) {
            vec3 lightDir = normalize(spotLights[i].position - vPosition);
            float distance = length(spotLights[i].position - vPosition);
            
            // Spotlight effect
            float spotEffect = dot(normalize(-spotLights[i].direction), lightDir);
            if(spotEffect > spotLights[i].coneCos) {
                float spotIntensity = smoothstep(spotLights[i].penumbraCos, spotLights[i].coneCos, spotEffect);
                float attenuation = pow(clamp(1.0 - distance / spotLights[i].distance, 0.0, 1.0), spotLights[i].decay);
                
                // Reduce light intensity scaling
                float lightIntensity = spotLights[i].intensity * 0.05; // Reduced from 0.1 to 0.05
                
                // Reduced diffuse contribution
                float diff = max(dot(normal, lightDir), 0.0) * 0.5; // Reduced from 0.7 to 0.5
                vec3 diffuse = diff * spotLights[i].color * lightIntensity;
                
                // Reduced specular contribution
                vec3 halfwayDir = normalize(lightDir + viewDir);
                float spec = pow(max(dot(normal, halfwayDir), 0.0), 64.0);
                vec3 specular = spec * spotLights[i].color * lightIntensity * 0.2; // Reduced from 0.3 to 0.2
                
                totalDiffuse += diffuse * attenuation * spotIntensity;
                totalSpecular += specular * attenuation * spotIntensity;
            }
        }
    }
    
    // Final color with slightly reduced overall intensity
    vec3 result = ambient + (totalDiffuse + totalSpecular) * baseColor * 0.9;
    
    gl_FragColor = vec4(result, 1.0);
}
`;

