import { mat4, vec4, vec3, mat3, vec2 } from "gl-matrix";
import { createBlankTexture, createFramebuffer, createIndexedStateTexture, createPNGTexture, createProgram, loadJSONFile, ShaderProgram } from "./gl-util";
import blend_quad_vs from "./blend-quad.vs.glsl";
import blend_quad_fs from "./blend-quad.fs.glsl";
import { FrameParams, Viewport } from "./graphics";

// Create rendering pipeline and draw quad to start
// Then load in a mesh
// Then add particles into a series of textures and use a vertex shader to render quads in their position
// Include position, velocity and gravity point, as well as fixed forces from motion or cursor
// Add after effects like trails, glow, regional colour

// This is a really thin and not really re-usable piece of code, specifically for this one purpose. Consider refactoring/
// borrowing from other projects if need more complexity

export class BlendQuad {
    private blend_quad_program: ShaderProgram;

    constructor(private readonly gl: WebGL2RenderingContext, viewport: Viewport) {

        this.blend_quad_program = createProgram(this.gl, {
            vs_source: blend_quad_vs,
            fs_source: blend_quad_fs,
            attrib: [],
            uniform: ["background_tex", "foreground_tex"]
        });
    }

    public frame(frame_params: FrameParams, background: WebGLTexture, foreground: WebGLTexture) {

        const gl = this.gl;

        this.blend_quad_program.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, frame_params.framebuffer);
        gl.viewport(0, 0, frame_params.viewport.width, frame_params.viewport.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.depthRange(0.0, 1.0);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //gl.depthMask(false);
        gl.enable(gl.DEPTH_TEST);
        gl.colorMask(true, true, true, true);
        gl.disable(gl.CULL_FACE);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, background);
        gl.uniform1i(this.blend_quad_program.uniforms.background_tex, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, foreground);
        gl.uniform1i(this.blend_quad_program.uniforms.foreground_tex, 1);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
