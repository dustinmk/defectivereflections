#version 300 es

precision highp float;

uniform float time;
uniform vec2 resolution;

in vec2 uv;
out vec4 outColor;

int NUM_OCTAVES = 8;

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

float fbm(vec2 x) {
	float v = 0.0;
	float a = 0.5;
	//vec2 shift = vec2(100);
	// Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.27), sin(0.27), -sin(0.27), cos(0.27));
	for (int i = 0; i < NUM_OCTAVES; ++i) {
		v += a * noise(x);
		x = rot * x * 2.0; // + shift;
		a *= 0.5;
	}
	return v;
}

void main() {
    vec2 st = 8.0 * 8.0 * uv;
    vec3 color = vec3(0.0);

    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*time);
    q.y = fbm( st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(2.5,6.7)+ 0.23*time );
    r.y = fbm( st + 1.0*q + vec2(4.2,8.7)+ 0.11*time);

    float f = fbm(st+r);

    color = mix(vec3(0.9,0.5,0.9),
                vec3(0.8,0.5,0.5),
                clamp((f*f)*4.0,0.0,1.0));

    color = mix(color,
                vec3(0.5,0.5,0.9),
                clamp(3.0*length(q),0.0,1.0));

    color = mix(color,
                vec3(0.8,0.8,0.8),
                clamp(2.0*length(r.x),0.0,1.0));

    // float vignette = length(uv - vec2(0.5, 1.0)) / sqrt(2.0);
    float vignette = 1.0;
    // vignette = clamp(1.0 * exp(-4.0 * (vignette)), 0.0, 1.0);
    outColor = vec4(color * 0.7 + (0.3 * color * vignette), 1.0);
}