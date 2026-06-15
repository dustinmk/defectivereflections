#version 300 es

precision highp float;

uniform float dt;
uniform sampler2D sdf_tex;
uniform sampler2D scene_tex;

uniform float time;
uniform vec2 mouse_pos;
uniform vec2 resolution;

in vec2 uv;
layout(location = 0) out vec4 outColor;

float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

float smin(float a, float b, float k) {
    k *= 1.0;
    float r = exp2(-a/k) + exp2(-b/k);
    return -k*log2(r);
}

float scene(vec3 p) {
    vec4 sphere = vec4(0.5 * (mouse_pos.xy + 1.0), 0.0, 0.05);

    vec4 sdf = texture(sdf_tex, p.xy);
    float depth = 0.1;
    float text_depth = 1.0;
    float text_sdf = sqrt(1.0 - (1.0 - sdf.r) * (1.0 - sdf.r));
    //float sphere_sdf = length(cross(vec3(0.0, 0.0, 1.0), p - sphere.xyz));
    //float sphere_dist = sphere_sdf > sphere.w ? 1.0 : sphere_sdf;

    float center_dist = length(vec2((p.x - sphere.x) * resolution.x / resolution.y, p.y - sphere.y));
    float root = sphere.w * sphere.w - center_dist * center_dist;
    float sphere_dist = root > 0.0 ? sqrt(root) / 0.05 : 1.0;

    // return smin(
    //     max(0.8, min(0.88, sdf.r) * text_depth),
    //     max(0.8, min(0.88, 8.0 * (length(0.5 * (sphere.xy + 1.0) - uv.xy) - sphere.w)) * text_depth),
    //     0.5
    // );

    //return clamp(smin(text_sdf, sphere_sdf, 0.1), 0.8, 0.88);
    return smin(clamp(text_sdf, 0.8, 0.88), sphere_dist - 0.2, 0.1);
    //return smin(1.0 - text_sdf, sphere_sdf, 0.1);
    //return sphere_dist;
    //return text_sdf;
    //return clamp(text_sdf, 0.8, 0.88);

}

vec3 getNormal(vec3 p) {
    const float h = 0.0005;
    vec2 k = vec2(1.0, -1.0);
    
    vec3 g = k.xyy * scene(p + k.xyy * h) + 
        k.yyx * scene(p + k.yyx * h) + 
        k.yxy * scene(p + k.yxy * h) + 
        k.xxx * scene(p + k.xxx * h);
    
    return dot(g, g) < 1e-12 ? vec3(0.0, 0.0, 1.0) : normalize(g);
}

void main() {
    vec2 base_uv = uv;
    vec4 sdf = texture(sdf_tex, base_uv);
    float depth = 0.1;
    float text_depth = 0.1;

    float c = 0.4;
    float dc = 0.05;
    float alpha = smoothstep(c - dc, c + dc, sdf.r);

    vec3 dir = normalize(vec3(0.0, 0.0, 1.0));
    vec3 p = vec3(base_uv, 0.0);
    vec3 n = getNormal(p);

   // n = length(n) < 0.9 ? vec3(0.0, 0.0, 1.0) : n;
    float ln = length(n);
    vec3 n1 = (ln < 0.9) ? vec3(0.0, 0.0, 1.0) : n;
    vec3 light = normalize(vec3(cos(time), sin(time), 0.0));
    float color = clamp(dot(-n, light), 0.0, 1.0);
    vec3 refracted = refract(dir, -n, 1.0 / 1.5);
    float mag_r = length(refracted);
    refracted = normalize(refracted);

    // Simplified ray-plane intercept - only checking flat plane
    float rt = clamp(0.2 / refracted.z, 0.0, 1.0);
    vec2 offset = clamp(refracted.xy * rt, -1.0, 1.0);
    vec2 sample_coord = base_uv + offset;
    vec4 sample_pos = texture(scene_tex, sample_coord);

    // outColor = vec4(mag_r * sample_pos.rgb + (1.0 - mag_r) * vec3(1.0, 1.0, 1.0), 1.0);
    //outColor = vec4(scene(p), 0.0, 0.0, 1.0);
    //outColor = vec4(n, 1.0);
    // outColor = vec4(mag_r, 0.0, 0.0, 1.0);
    
    //outColor = vec4(offset, 0.0, 1.0);
    outColor = vec4(mix(sample_pos.rgb, vec3(1.0, 1.0, 1.0), color), sample_pos.a);
    //outColor = vec4(sample_pos.rgb, 1.0);
    //outColor = texture(scene_tex, uv);
    // outColor = vec4(sample_pos.rgb, 1.0);
    // outColor = vec4(color, 0.0, 0.0, 1.0);
    //outColor = vec4(1.0, 0.0, 0.0, 1.0);
}