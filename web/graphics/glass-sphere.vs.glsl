#version 300 es

uniform vec4 quad_size;

vec2 points[4] = vec2[4](
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 1.0),
    vec2(1.0, 0.0)
);

out vec2 uv;

void main() {
    vec2 point = points[gl_VertexID];

    vec2 pos = vec2(quad_size.x + point.x * quad_size.z, quad_size.y + point.y * quad_size.w);
    gl_Position = vec4(pos, 0.9999999, 1.0);
    uv = points[gl_VertexID].xy;
}