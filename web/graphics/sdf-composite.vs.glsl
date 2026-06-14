#version 300 es

uniform vec4 char_rects[256];

vec2 points[4] = vec2[4](
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 1.0),
    vec2(1.0, 0.0)
);

out vec2 uv;
flat out int instanceID;

void main() {
    vec4 char_rect = char_rects[gl_InstanceID];

    vec2 pos = vec2(((char_rect.xy + (points[gl_VertexID] * vec2(char_rect.z, 2.0 * char_rect.w))) * 2.0) - 1.0);
    gl_Position = vec4(pos, 0.0, 1.0);
    uv = points[gl_VertexID].xy;
    instanceID = gl_InstanceID;
}