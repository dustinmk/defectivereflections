#version 300 es

precision highp float;

in vec2 uv;
out vec4 outColor;

void main() {
    float sdf_distance = 1.5 * (sqrt(2.0) / 2.0) - length(uv - vec2(0.5, 0.5));
    outColor = vec4(vec3(sdf_distance * sdf_distance), sdf_distance * sdf_distance); // ((sqrt(2.0) / 2.0) - length(uv - vec2(0.5, 0.5))));
    //outColor = vec4(1.0, 1.0, 0.0, 1.0);
}