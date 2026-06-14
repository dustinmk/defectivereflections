import { mat4, vec4, vec3, mat3, vec2 } from "gl-matrix";
import { createBlankTexture, createFramebuffer, createIndexedStateTexture, createPNGTexture, createProgram, loadJSONFile, ShaderProgram } from "./gl-util";
import glass_sphere_vs from "./glass-sphere.vs.glsl";
import glass_sphere_fs from "./glass-sphere.fs.glsl";
import { FrameParams, Viewport } from "./graphics";

// Create rendering pipeline and draw quad to start
// Then load in a mesh
// Then add particles into a series of textures and use a vertex shader to render quads in their position
// Include position, velocity and gravity point, as well as fixed forces from motion or cursor
// Add after effects like trails, glow, regional colour

// This is a really thin and not really re-usable piece of code, specifically for this one purpose. Consider refactoring/
// borrowing from other projects if need more complexity

export class GlassSphere {
    private glass_sphere_program: ShaderProgram;
    private mouse_pos: number[] = [0.0, 0.0];

    constructor(private readonly gl: WebGL2RenderingContext, viewport: Viewport, navigate: (path: string) => void) {

        this.glass_sphere_program = createProgram(this.gl, {
            vs_source: glass_sphere_vs,
            fs_source: glass_sphere_fs,
            attrib: [],
            uniform: ["quad_size", "scene_tex", "depth_tex", "eye_pos", "eye_dir", "projection", "perspective", "inv_transform", "resolution", "highlight_color"]
        });

        document.body.addEventListener("mousemove", evt => {
            this.mouse_pos = [
                (evt.clientX / document.body.clientWidth * 2.0 - 1.0) * viewport.width / viewport.height,
                -1.0 * (evt.clientY / document.body.clientHeight * 2.0 - 1.0)
            ];

            const mouse_range = vec2.length(vec2.sub(vec2.create(), this.mouse_pos, [0.0, 0.0]));
            // if (mouse_range <= 0.1 * viewport.width / viewport.height) {
            //     document.body.style.cursor = "pointer";
            // } else {
            //     document.body.style.cursor = "auto";
            // }
        });

        document.body.addEventListener("click", evt => {
            const mouse_range = vec2.length(vec2.sub(vec2.create(), this.mouse_pos, [0.0, 0.0]));
            if (mouse_range <= 0.1 * viewport.width / viewport.height) {
                navigate("/articles");
            }
        })
    }

    public frame(frame_params: FrameParams) {

        const gl = this.gl;

        this.glass_sphere_program.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, frame_params.framebuffer);
        gl.viewport(0, 0, frame_params.viewport.width, frame_params.viewport.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.depthRange(0.0, 1.0);
        // // gl.clearColor(0.75, 0.80, 0.85, 1.0);
        // // gl.clearDepth(1.0);
        // // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //gl.depthMask(false);
        gl.enable(gl.DEPTH_TEST);
        gl.colorMask(true, true, true, true);
        gl.disable(gl.CULL_FACE);

        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, frame_params.scene_texture);
        // gl.uniform1i(this.glass_sphere_program.uniforms.scene_tex, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, frame_params.scene_texture);
        gl.uniform1i(this.glass_sphere_program.uniforms.scene_tex, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, frame_params.depth_texture);
        gl.uniform1i(this.glass_sphere_program.uniforms.depth_tex, 1);

        const transform = mat4.mul(mat4.create(), frame_params.perspective, frame_params.projection);
        const inv_transform = mat4.invert(mat4.create(), transform);
        if (inv_transform === null) {
            return;
        }
        const world_center = vec4.fromValues(0, 0, 0, 1);
        const radius = 0.1;
        const center = vec4.transformMat4(vec4.create(), world_center, transform);
        const sphere_right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), frame_params.eye_dir, [0, 1, 0]));
        const right_bound = vec3.scaleAndAdd(vec3.create(), world_center, sphere_right, radius);
        const right_screen_bound = vec4.transformMat4(vec4.create(), [...right_bound, 1.0], transform);
        const screen_radius = right_screen_bound[0] - center[0];
        const quad_size = [
            center[0] - screen_radius,
            (center[1] - screen_radius) / frame_params.viewport.height * frame_params.viewport.width,
            screen_radius * 2,
            screen_radius * 2 / frame_params.viewport.height * frame_params.viewport.width,
        ];

        const mouse_range = vec2.length(vec2.sub(vec2.create(), this.mouse_pos, [0.0, 0.0]));
        if (mouse_range <= radius * frame_params.viewport.width / frame_params.viewport.height) {
            gl.uniform3f(this.glass_sphere_program.uniforms.highlight_color, 0.1, 0.1, 0.1);
        } else {
            gl.uniform3f(this.glass_sphere_program.uniforms.highlight_color, 0.0, 0.0, 0.0);
        }

        gl.uniform4f(this.glass_sphere_program.uniforms.quad_size, quad_size[0], quad_size[1], quad_size[2], quad_size[3]);
        gl.uniform2f(this.glass_sphere_program.uniforms.resolution, frame_params.viewport.width, frame_params.viewport.height);
        gl.uniform3f(this.glass_sphere_program.uniforms.eye_pos, frame_params.eye_pos[0], frame_params.eye_pos[1], frame_params.eye_pos[2]);
        gl.uniform3f(this.glass_sphere_program.uniforms.eye_dir, frame_params.eye_dir[0], frame_params.eye_dir[1], frame_params.eye_dir[2]);
        gl.uniformMatrix4fv(this.glass_sphere_program.uniforms.projection, false, frame_params.projection);
        gl.uniformMatrix4fv(this.glass_sphere_program.uniforms.perspective, false, frame_params.perspective);
        gl.uniformMatrix4fv(this.glass_sphere_program.uniforms.inv_transform, false, inv_transform);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
