#version 300 es

precision highp float;

uniform float dt;
uniform sampler2D mtsdf_tex;

uniform vec4 glyph_rects[256];
uniform vec4 char_rects[256];
uniform int char_count;
uniform float time;

in vec2 uv;
in vec2 pos;
flat in int instanceID;
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
    vec4 sphere = vec4(0.3, 0.3, 0.0, 0.2);
    vec4 sphere1 = vec4(0.7, 0.7, 0.0, 0.2);
    // return smin(
    //     length(p - sphere.xyz) - sphere.w,
    //     length(p - sphere1.xyz) - sphere1.w,
    //     0.1
    // );

    vec4 glyph_rect = glyph_rects[instanceID];
    vec2 glyph_uv = vec2(
        glyph_rect.x + (glyph_rect.z - glyph_rect.x) * p.x,
        glyph_rect.y + (glyph_rect.w - glyph_rect.y) * p.y);

    vec4 sdf_tex = texture(mtsdf_tex, glyph_uv);
    float sdf = median(sdf_tex.r, sdf_tex.g, sdf_tex.b);
    sdf = sqrt(1.0 - (1.0 - sdf) * (1.0 - sdf));
    float dist = (p.z - min(0.885, sdf));
    //float raw_dist = 1.0 - abs(p.z - min(0.5, sdf));
    //float dist = sqrt(1.0 - (1.0 - raw_dist) * (1.0 - raw_dist));
    //float dist = 1.0 - abs(p.z - sin(1.0 - min(0.5, sdf)));
    //float dist = raw_dist;
    return min(
        100.0, //length(p.xy - sphere.xy) - sphere.w,
        dist
        //0.1
    );
}

vec3 getNormal(vec3 p) {
    // vec2 e = vec2(0.01, 0);
    // vec3 n = scene(p) - vec3(
    //     scene(p - e.xyy),
    //     scene(p - e.yxy),
    //     scene(p - e.yyx));
    // return normalize(n);

    const float h = 0.005; // Tiny offset
    vec2 k = vec2(1.0, -1.0);
    
    return normalize(
        k.xyy * scene(p + k.xyy * h) + 
        k.yyx * scene(p + k.yyx * h) + 
        k.yxy * scene(p + k.yxy * h) + 
        k.xxx * scene(p + k.xxx * h)
    );
}

void main() {
    vec4 glyph_rect = glyph_rects[instanceID];
    vec2 glyph_uv = vec2(
        glyph_rect.x + (glyph_rect.z - glyph_rect.x) * uv.x,
        glyph_rect.y + (glyph_rect.w - glyph_rect.y) * uv.y);

    vec4 sdf_tex = texture(mtsdf_tex, glyph_uv);
    float dist = median(sdf_tex.r, sdf_tex.g, sdf_tex.b);
    float w = fwidth(dist);
    float opacity = smoothstep(0.5 - w, 0.5 + w, dist);

    vec2 norm_pos = (pos + 1.0) / 2.0;
    float checker_x = ((norm_pos.x * 200.0) / 2.0) - floor((norm_pos.x * 200.0) / 2.0) > 0.5 ? 0.0 : 1.0;
    float checker_y = ((norm_pos.y * 200.0) / 2.0) - floor((norm_pos.y * 200.0) / 2.0) > 0.5 ? 0.0 : 1.0;
    float checker = checker_x > 0.5 ? checker_y < 0.5 ? 1.0 : 0.0 : checker_y > 0.5 ? 1.0 : 0.0;

    

    vec3 origin = vec3(uv.x, uv.y, -1.0);
    vec3 dir = normalize(vec3(0.0, 0.0, 1.0));

    float dt = 0.1;
    float t = 0.0;
    for (int i = 0; i < 20; i++) {
        vec3 p = origin + dir * t;

        dt = scene(p);

        t += dt;

        if (dt > 10.0 || dt < 0.01) {
            break;
        }
    }

    float c = 0.4;
    float dc = 0.05;
    float alpha = smoothstep(c - dc, c + dc, dist);

    vec3 p = origin + dir * t;
    if ( t < 10.0 ) {
        vec3 n = getNormal(p);
        n = length(n) < 0.9 ? vec3(0.0, 0.0, 1.0) : n;
        vec3 light = normalize(vec3(cos(time), sin(time), -1.0));
        float color = dot(-n, light);
        outColor = vec4(vec3(color), alpha);
        vec3 n1 = length(n) < 0.5 ? normalize(vec3(0.0, 0.0, 1.0)) : normalize(n);
        //outColor = length(n1) > 0.5 ? vec4(1.0, 0.0, 0.0, 0.5) : vec4(0.0, 1.0, 0.0, 0.5); //vec4(vec3(length(n)), 1.0);
    } else {
        outColor = vec4(1.0, 0.0, 0.0, 1.0);
    }

    // outColor = vec4(checker, checker, checker, opacity);
    
    //outColor = vec4(vec3(sdf_tex.a), sdf_tex.a);
}