#version 300 es

uniform sampler2D anchor_tex;
uniform mat4 projection;
uniform mat4 perspective;

vec4 points[4] = vec4[4](
    vec4(-1.0, 1.0, 0.0, 1.0),
    vec4(-1.0, -1.0, 0.0, 1.0),
    vec4(1.0, 1.0, 0.0, 1.0),
    vec4(1.0, -1.0, 0.0, 1.0)
);

out vec2 uv;

void main() {
    gl_Position = points[gl_VertexID];
    uv = (points[gl_VertexID].xy + 1.0) / 2.0;
}