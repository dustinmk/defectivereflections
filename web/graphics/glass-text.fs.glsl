#version 300 es

precision highp float;

uniform float dt;
uniform float time;
uniform sampler2D mtsdf_tex;

uniform vec4 glyph_rects[256];
uniform vec4 char_rects[256];
uniform int char_count;

in vec2 uv;
flat in int instanceID;
out vec4 outColor;

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
    float opacity = smoothstep(0.9 - w, 0.9 + w, dist);

    outColor = vec4(1.0, 1.0, 1.0, opacity);

    //outColor = vec4(glyph_rect.xy, 0.0, 1.0);
}