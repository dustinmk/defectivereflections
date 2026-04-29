#version 300 es

uniform sampler2D position_tex;
uniform mat4 projection;
uniform mat4 perspective;

vec4 points[4] = vec4[4](
    vec4(-0.5, 0.5, 0.0, 1.0),
    vec4(-0.5, -0.5, 0.0, 1.0),
    vec4(0.5, 0.5, 0.0, 1.0),
    vec4(0.5, -0.5, 0.0, 1.0)
    
);

out vec2 uv;
out vec4 position;

void main() {
    float row = floor(float(gl_InstanceID) / 256.0);
    float col = float(gl_InstanceID) - (256.0 * row);

    vec2 index = vec2(col / 256.0, row / 256.0); 
    vec4 position = projection * texture(position_tex, index);
    vec3 quad_position = points[gl_VertexID].xyz * 0.01;
    //gl_Position = projection * vec4(quad_position + anchor.xyz, 1.0);
    gl_Position = perspective * vec4(quad_position + position.xyz, 1.0);
    position = gl_Position;
    //gl_Position = vec4(quad_position, 1.0);
    uv = points[gl_VertexID].xy + 0.5;
}