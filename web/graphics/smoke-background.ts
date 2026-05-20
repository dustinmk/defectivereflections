import { mat4, vec4, vec3, mat3 } from "gl-matrix";
import { createBlankTexture, createFramebuffer, createIndexedStateTexture, createPNGTexture, createProgram, loadJSONFile, ShaderProgram } from "./gl-util";
import smoke_background_vs from "./smoke-background.vs.glsl";
import smoke_background_fs from "./smoke-background.fs.glsl";
import composite_vs from "./composite.vs.glsl";
import composite_fs from "./composite.fs.glsl";
import { FrameParams, Viewport } from "./graphics";

export class SmokeBackground {
    private smoke_program: ShaderProgram;
    //private noise_tex: WebGLTexture;

    constructor(private readonly gl: WebGL2RenderingContext, viewport: Viewport) {
        this.smoke_program = createProgram(this.gl, {
            vs_source: smoke_background_vs,
            fs_source: smoke_background_fs,
            attrib: [],
            uniform: ["time", "resolution"]
        });
    }

    public frame(frame_params: FrameParams) {

        const gl = this.gl;

        this.smoke_program.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, frame_params.framebuffer);

        gl.viewport(0, 0, frame_params.viewport.width, frame_params.viewport.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);
        gl.depthRange(0.0, 1.0);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.uniform1f(this.smoke_program.uniforms.time, frame_params.now / 1000.0);
        gl.uniform2f(this.smoke_program.uniforms.resolution, frame_params.viewport.width, frame_params.viewport.height);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
