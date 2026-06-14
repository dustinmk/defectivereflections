#version 300 es

precision highp float;

uniform sampler2D background_tex;
uniform sampler2D foreground_tex;

in vec2 uv;
out vec4 outColor;

void main() {
    vec4 background = texture(background_tex, uv);
    vec4 foreground = texture(foreground_tex, uv);

    outColor = vec4(foreground.rgb + background.a * background.rgb, 1.0);
    //outColor = vec4(vec3(foreground.a), 1.0);
}