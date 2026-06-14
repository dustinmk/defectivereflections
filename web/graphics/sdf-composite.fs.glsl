#version 300 es

precision highp float;

uniform sampler2D mtsdf_tex;

uniform vec4 glyph_rects[256];

in vec2 uv;
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
    outColor = vec4(dist, 0.0, 0.0, 1.0);
}