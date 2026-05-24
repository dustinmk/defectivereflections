#version 300 es

precision highp float;

uniform sampler2D composite_tex;
uniform sampler2D scene_tex;

in vec2 uv;
out vec4 outColor;

void main() {
    vec4 composite = texture(composite_tex, uv);
    vec4 scene = texture(scene_tex, uv);

    float px = 1.0 / 256.0;
    float constants[9] = float[9](
        0.1, 0.2, 0.1,
        0.2, 1.5, 0.2,
        0.1, 0.2, 0.1
    );
    vec2 offsets[9] = vec2[9](
        vec2(-1.0, -1.0),   vec2(0.0, -1.0),    vec2(1.0, -1.0),
        vec2(-1.0, 0.0),   vec2(0.0, 0.0),    vec2(1.0, 0.0),
        vec2(-1.0, 1.0),   vec2(0.0, 1.0),    vec2(1.0, 1.0)
    );
    float denom = (0.1 * 4.0) + (0.2 * 4.0) + 1.5;

    vec4 color_accum = vec4(0.0, 0.0, 0.0, 0.0);
    for (int i = 0; i < 9; i++) {
        color_accum += (constants[i] / denom) * texture(scene_tex, uv + offsets[i] * px);
    }
    //
    //outColor = vec4(vec3((composite.a * (0.4 * composite.rgb + 0.6 * color_accum.rgb)) + (1.0 - composite.a) * scene.rgb), 1.0);
    outColor = vec4(vec3((composite.a * composite.rgb) + (1.0 - composite.a) * scene.rgb), 1.0);
    //outColor = vec4(composite.rgb, 1.0);
}