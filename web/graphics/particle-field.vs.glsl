#version 300 es

uniform sampler2D position_tex;
uniform sampler2D anchor_tex;
uniform mat4 projection;
uniform mat4 perspective;
uniform vec2 particle_count;
uniform vec3 eye_pos;

uniform float time;

vec4 points[4] = vec4[4](
    vec4(-0.5, 0.5, 0.0, 1.0),
    vec4(-0.5, -0.5, 0.0, 1.0),
    vec4(0.5, 0.5, 0.0, 1.0),
    vec4(0.5, -0.5, 0.0, 1.0)
    
);

out vec2 uv;
out float range;
out float eye_dist;
out float instance_offset;
out vec4 position;
out float particle_color;

void main() {
    instance_offset = float(gl_InstanceID) / (particle_count.x * particle_count.y);

    float row = floor(float(gl_InstanceID) / particle_count.y);
    float col = float(gl_InstanceID) - (particle_count.y * row);

    vec2 index = vec2(col / particle_count.x, row / particle_count.y); 
    vec4 world_position = texture(position_tex, index);
    vec4 anchor = texture(anchor_tex, index);
    particle_color = anchor.a;
    vec4 position = projection * world_position;
    vec3 quad_position = points[gl_VertexID].xyz * (0.005 + 0.005 * instance_offset);
    //gl_Position = projection * vec4(quad_position + anchor.xyz, 1.0);
    gl_Position = perspective * vec4(quad_position + position.xyz, 1.0);
    position = gl_Position;
    //gl_Position = vec4(quad_position, 1.0);
    uv = points[gl_VertexID].xy + 0.5;
    range = length(world_position.xz);
    eye_dist = length(world_position.xyz - eye_pos);
    //instance_offset = (index.x + index.y) / 32.0;
    
}