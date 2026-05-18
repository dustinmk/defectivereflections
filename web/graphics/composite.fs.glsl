#version 300 es

precision highp float;

uniform sampler2D composite_tex;

in vec2 uv;
out vec4 outColor;

void main() {
    outColor = texture(composite_tex, uv);
}