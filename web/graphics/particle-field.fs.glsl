#version 300 es

precision highp float;

in vec2 uv;
in vec4 position;
out vec4 outColor;

void main() {
    float sdf_distance = 1.0 - (2.0 * length(uv - vec2(0.5, 0.5)) / sqrt(2.0));
    float depth_factor = (1.0 / (1.0 + position.z));
    float luminance = sdf_distance * sdf_distance * depth_factor;
    luminance = 0.5 * tanh(4.0 * (luminance - 0.3));        // Heaviside step function
    outColor = vec4(vec3(luminance, luminance, luminance), luminance); // ((sqrt(2.0) / 2.0) - length(uv - vec2(0.5, 0.5))));
    //outColor = vec4(1.0, 1.0, 0.0, 1.0);
}