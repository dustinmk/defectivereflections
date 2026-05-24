#version 300 es

precision highp float;

uniform sampler2D scene_tex;
uniform vec3 eye_dir0;
uniform vec3 eye_pos0;
uniform mat4 projection;
uniform mat4 perspective;
uniform vec4 quad_size;
uniform vec2 resolution;

in vec2 uv;
layout(location = 0) out vec4 outColor;

vec3 intersect_ray_sphere(vec3 eye_pos, vec3 eye_dir, vec3 sphere_center, float radius) {
    return vec3(0.0, 0.0, 0.0);
}

void main() {
    float alpha = 1.0 - smoothstep(0.49, 0.51, length(uv - vec2(0.5, 0.5)));
    vec2 screenspace_pos = vec2((quad_size.x + uv.x * quad_size.z), (quad_size.y + uv.y * quad_size.w)  * resolution.y / resolution.x);

    float glow = smoothstep(0.5, 0.7, 1.0 - length(uv - vec2(0.5, 0.5)));

    vec3 sphere_center = vec3(0.0, 0.0, 0.0);
    float sphere_radius = 0.08;

    // eye ray intersect sphere
    vec3 eye_dir = vec3(0.0, 0.0, 1.0);
    vec3 eye_pos = vec3(screenspace_pos, 0.0);
    float a = dot(eye_dir, eye_dir);
    vec3 origin_center = eye_pos - sphere_center;
    float b = 2.0 * dot(eye_dir, origin_center);
    float c = dot(origin_center, origin_center) - sphere_radius * sphere_radius;
    float discriminant = b * b - 4.0 * a * c;
    if (discriminant > 0.0) {
        float sqrt_discriminant = sqrt(discriminant);
        float t0 = (-b + sqrt_discriminant) / (2.0 * a);
        float t1 = (-b - sqrt_discriminant) / (2.0 * a);
        float t = t0 < t1 ? t0 : t1;
        vec3 intersect = eye_pos + t * eye_dir;
        vec3 normal = normalize(intersect - sphere_center);
        vec3 refract_dir = refract(eye_dir, normal, 1.0 / 1.5);

        vec4 scene_sample_r = texture(scene_tex, (screenspace_pos + 1.0) / 2.0 + 0.8 * refract_dir.xy);
        vec4 scene_sample_g = texture(scene_tex, (screenspace_pos + 1.0) / 2.0 + 0.8 * refract_dir.xy + 0.02);
        vec4 scene_sample_b = texture(scene_tex, (screenspace_pos + 1.0) / 2.0 + 0.8 * refract_dir.xy + 0.05);
        vec3 color_glow = 0.2 * vec3(0.9, 0.8, 0.7);
        outColor = vec4(scene_sample_r.r + color_glow.r, scene_sample_g.g + color_glow.g, scene_sample_b.b + color_glow.b, alpha);

    } else {
        
        outColor = vec4(vec3(0.9, 0.8, 0.7) * glow, 0.5 * glow);
    }

    
}