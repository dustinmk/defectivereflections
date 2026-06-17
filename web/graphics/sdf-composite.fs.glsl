#version 300 es

precision highp float;

uniform sampler2D mtsdf_tex;
uniform float time;



in vec2 uv;
in vec2 position;
in vec4 glyph_rect;
layout(location = 0) out vec4 outColor;

float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

void main() {
    vec2 glyph_uv = vec2(
        glyph_rect.x + (glyph_rect.z - glyph_rect.x) * uv.x,
        glyph_rect.y + (glyph_rect.w - glyph_rect.y) * uv.y);
    float offset = cos(4.0 * 3.14159 *  position.x + 0.2 * time);
    offset = offset * offset;
    offset = offset * offset;
    offset = offset * offset;
    offset = offset * offset;
    offset = offset * offset;
    offset = offset * offset;
    offset = offset * offset;
    glyph_uv = vec2(glyph_uv.x, glyph_uv.y + 0.01 * offset);

    vec4 sdf_tex = texture(mtsdf_tex, glyph_uv);
    float dist = median(sdf_tex.r, sdf_tex.g, sdf_tex.b);
    outColor = vec4(dist, 0.0, 0.0, 1.0);
}