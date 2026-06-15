#version 300 es

uniform vec4 text_rects[256];

vec2 points[4] = vec2[4](
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 1.0),
    vec2(1.0, 0.0)
    
);

out vec2 uv;

void main() {
    vec4 text_rect = text_rects[gl_InstanceID];
    gl_Position = vec4(-1.0 + 2.0 * (text_rect.xy + points[gl_VertexID] * text_rect.zw), 0.0, 1.0);
    uv = (gl_Position.xy + 1.0) / 2.0;
}