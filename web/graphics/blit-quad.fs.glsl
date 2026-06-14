#version 300 es

precision highp float;

uniform sampler2D source_tex;
uniform sampler2D depth_tex;

in vec2 uv;
out vec4 outColor;

void main() {
    vec4 source = texture(source_tex, uv);
    vec4 depth = texture(depth_tex, uv);

    outColor = source;
#ifdef DEPTH
    gl_FragDepth = depth.r > 0.01 ? depth.r : 1.0;
#endif

#ifndef DEPTH
    gl_FragDepth = 1.0;
#endif

    float near = 0.01;
    float far = 100.0;
    float d = depth.r;
    float linear_depth = (near * far) / (far - d * (far - near)); 

    //outColor = vec4(vec3(linear_depth / 5.0), 1.0);
    ///gl_FragDepth = 0.0;
    //outColor = vec4(vec3(gl_FragDepth), 1.0);
}