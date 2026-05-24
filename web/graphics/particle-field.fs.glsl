#version 300 es

precision highp float;

uniform float time;

in vec2 uv;
in vec4 position;
in float instance_offset;
in float range;
out vec4 outColor;

void main() {
    float sdf_distance = 1.0 - (2.0 * length(uv - vec2(0.5, 0.5)) / sqrt(2.0));
    float depth_factor = (1.0 / (1.0 + position.z));
    float luminance = sdf_distance * sdf_distance * depth_factor;
    luminance = 0.5 * tanh(4.0 * (luminance - 0.3));        // Heaviside step function
    vec3 color = vec3(luminance * mix(vec3(0.7, 0.2, 0.1), vec3(0.7, 0.8, 0.1), cos(5.0 * (time + 3.14 * 2.0 * instance_offset))));
    float shine = clamp(1.0 - (range / 1.25), 0.0, 1.0);
    outColor = vec4(color + shine * 0.7 * vec3(1.0, 1.0, 1.0), luminance);
    //outColor = vec4(shine, 0.0, 0.0, 1.0);
    //outColor = vec4(vec3(abs(cos(5.0 * (time + 3.14 * 2.0 * instance_offset)) * luminance), abs(sin(5.0 * (time + 3.14 * 2.0 * instance_offset))) * luminance, luminance), luminance); // ((sqrt(2.0) / 2.0) - length(uv - vec2(0.5, 0.5))));
    //outColor = vec4(1.0, 1.0, 0.0, 1.0);
}