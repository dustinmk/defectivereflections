#version 300 es

precision highp float;

uniform float time;

in vec2 uv;
in vec4 position;
in float eye_dist;
in float instance_offset;
in float range;
in float particle_color;
in vec4 normal;
out vec4 outColor;

vec3 mix_color_0[2] = vec3[2](
    vec3(1.0, 0.9, 0.7),
    vec3(0.0, 0.1, 0.7)
);

vec3 mix_color_1[2] = vec3[2](
    vec3(0.9, 0.3, 0.8),
    vec3(0.1, 0.4, 0.9)
);

void main() {
    float sdf_distance = 1.0 - (2.0 * length(uv - vec2(0.5, 0.5)) / sqrt(2.0));
    //float depth_factor = (1.0 / (1.0 + position.z));
    float depth_factor = 0.5 * clamp(10.0 - eye_dist, 5.0, 10.0); //(1.0 / (1.0 + eye_dist));
    float luminance = sdf_distance * sdf_distance * depth_factor;
    luminance = 0.85 * tanh(4.0 * (luminance - 0.3));        // Heaviside step function
    //int mix_color_index = int(floor(particle_color)) < 1 ? 0 : 1;
    int mix_color_index = particle_color < 0.5 ? 0 : 1;
    //float normal_light = particle_color - floor(particle_color);
    float normal_light = clamp(dot(normalize(vec3(cos(-1.0 * time), 1.0, sin(-1.0 * time))), normal.xyz * 2.0 - 1.0), 0.0, 1.0);

    vec3 color_0 = mix_color_0[mix_color_index];
    vec3 color_1 = mix_color_1[mix_color_index];
    vec3 color = vec3(luminance * mix(color_0, color_1, cos(1.0 * (time + 3.14 * 2.0 * instance_offset))));
    float shine = clamp(1.0 - (range / 1.25), 0.0, 1.0);
    outColor = vec4((0.5 + 0.5 * normal_light) * (color + shine * 0.9 * vec3(1.0, 1.0, 1.0)), luminance);
    //outColor = vec4(vec3(normal_light), 1.0);
    //outColor = vec4(normal.xyz, 1.0);
    //outColor = vec4(particle_color.rgb, 1.0);
    //outColor = vec4(shine, 0.0, 0.0, 1.0);
    //outColor = vec4(vec3(abs(cos(5.0 * (time + 3.14 * 2.0 * instance_offset)) * luminance), abs(sin(5.0 * (time + 3.14 * 2.0 * instance_offset))) * luminance, luminance), luminance); // ((sqrt(2.0) / 2.0) - length(uv - vec2(0.5, 0.5))));
    //outColor = vec4(1.0, 1.0, 0.0, 1.0);
}