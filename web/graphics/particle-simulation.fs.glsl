#version 300 es

precision highp float;

uniform float dt;
uniform float time;
uniform sampler2D position_tex;
uniform sampler2D velocity_tex;
uniform sampler2D anchor_tex;

in vec2 uv;
layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outVelocity;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

void main() {
    vec4 position = texture(position_tex, uv);
    vec4 velocity = texture(velocity_tex, uv);
    vec4 anchor = texture(anchor_tex, uv);

    vec3 dir = normalize(anchor.xyz - position.xyz);
    float dist = length(position.xyz - anchor.xyz);
    vec3 anchor_force = (10.0 * dist * dir) - (3.0 * velocity.xyz);
    vec2 seed = uv + time;
    vec4 noise_force = 2.0 * exp(vec4(random(seed), random(seed + 1.0), random(seed + 2.0), 2.0) - 0.5) - 1.0;
    outVelocity = vec4(velocity.xyz + dt * (anchor_force + noise_force.xyz), 1.0);
    outPosition = vec4(position.xyz + (dt * velocity.xyz), 1.0);
    //outPosition = position + vec4(dt * dir, 0.0);
    //outPosition = position - vec4(dt * 0.001 * dir, 0.0);
    //outPosition = position;
    //outPosition = position + vec4(0.01, 0.01, 0.01, 0.0);
    //outPosition = vec4(cos(dt), sin(dt), 1.0, 1.0);
    //outVelocity = velocity;
}