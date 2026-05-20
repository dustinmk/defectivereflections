#version 300 es

precision highp float;

uniform sampler2D composite_tex;
uniform sampler2D scene_tex;

in vec2 uv;
out vec4 outColor;

void main() {
    vec4 composite = texture(composite_tex, uv);
    vec4 scene = texture(scene_tex, uv);

    outColor = vec4(vec3((scene.a * scene.rgb) + (1.0 - scene.a) * composite.rgb), 1.0);
}