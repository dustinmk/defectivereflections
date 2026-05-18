#version 300 es

precision highp float;

uniform float dt;
uniform float time;
uniform sampler2D mtsdf_tex;

uniform vec4 glyph_rects[256];
uniform vec4 char_rects[256];
uniform int char_count;

in vec2 uv;
in vec2 pos;
flat in int instanceID;
layout(location = 0) out vec4 outColor;

float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

void main() {
    vec4 glyph_rect = glyph_rects[instanceID];
    vec2 glyph_uv = vec2(
        glyph_rect.x + (glyph_rect.z - glyph_rect.x) * uv.x,
        glyph_rect.y + (glyph_rect.w - glyph_rect.y) * uv.y);

    vec4 sdf_tex = texture(mtsdf_tex, glyph_uv);
    float dist = median(sdf_tex.r, sdf_tex.g, sdf_tex.b);
    float w = fwidth(dist);
    float opacity = smoothstep(0.5 - w, 0.5 + w, dist);

    vec2 norm_pos = (pos + 1.0) / 2.0;
    float checker_x = ((norm_pos.x * 200.0) / 2.0) - floor((norm_pos.x * 200.0) / 2.0) > 0.5 ? 0.0 : 1.0;
    float checker_y = ((norm_pos.y * 200.0) / 2.0) - floor((norm_pos.y * 200.0) / 2.0) > 0.5 ? 0.0 : 1.0;
    float checker = checker_x > 0.5 ? checker_y < 0.5 ? 1.0 : 0.0 : checker_y > 0.5 ? 1.0 : 0.0;

    outColor = vec4(checker, checker, checker, opacity);
}