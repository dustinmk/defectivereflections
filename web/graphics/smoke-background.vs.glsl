#version 300 es

vec4 points[4] = vec4[4](
    vec4(-1.0, 1.0, 1.0, 1.0),
    vec4(-1.0, -1.0, 1.0, 1.0),
    vec4(1.0, 1.0, 1.0, 1.0),
    vec4(1.0, -1.0, 1.0, 1.0)
    
);

out vec2 uv;

void main() {
    gl_Position = points[gl_VertexID];
    uv = (points[gl_VertexID].xy + 1.0) / 2.0;
}