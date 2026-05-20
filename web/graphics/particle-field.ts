import { mat4, vec4, vec3, mat3 } from "gl-matrix";
import { createFramebuffer, createIndexedStateTexture, createProgram, ShaderProgram } from "./gl-util";
import particle_field_vs from "./particle-field.vs.glsl";
import particle_field_fs from "./particle-field.fs.glsl";
import particle_simulation_vs from "./particle-simulation.vs.glsl";
import particle_simulation_fs from "./particle-simulation.fs.glsl";
import { importGLB } from "./glb-import";
import { FrameParams } from "./graphics";
import { create } from "zustand";

// Create rendering pipeline and draw quad to start
// Then load in a mesh
// Then add particles into a series of textures and use a vertex shader to render quads in their position
// Include position, velocity and gravity point, as well as fixed forces from motion or cursor
// Add after effects like trails, glow, regional colour

// This is a really thin and not really re-usable piece of code, specifically for this one purpose. Consider refactoring/
// borrowing from other projects if need more complexity

export class ParticleField {
    
    private particle_program: ShaderProgram;
    private simulation_program: ShaderProgram;
    private simulation_framebuffers: WebGLFramebuffer[];
    private position_tex: WebGLTexture[];
    private anchor_tex: WebGLTexture;
    private velocity_tex: WebGLTexture[];
    private loaded_models: Set<string> = new Set();

    constructor(private readonly gl: WebGL2RenderingContext) {

        this.particle_program = createProgram(this.gl, {
            vs_source: particle_field_vs,
            fs_source: particle_field_fs,
            attrib: [],
            uniform: ["anchor_tex", "position_tex", "velocity_tex", "projection", "perspective"]
        });

        this.simulation_program = createProgram(this.gl, {
            vs_source: particle_simulation_vs,
            fs_source: particle_simulation_fs,
            attrib: [],
            uniform: ["anchor_tex", "position_tex", "velocity_tex", "dt", "time"]
        });

        this.simulation_framebuffers = [createFramebuffer(this.gl), createFramebuffer(this.gl)];

        const position_data: number[][][] = [];
        for (let y = 0; y < 256; ++y) {
            const row: number[][] = [];
            for (let x = 0; x < 256; ++x) {
                row.push([5.0 * Math.random() - 2.5, 5.0 * Math.random() - 2.5, 5.0 * Math.random() - 2.5, 1.0]);
            }
            position_data.push(row);
        }
        this.position_tex = [createIndexedStateTexture(this.gl, position_data), createIndexedStateTexture(this.gl, position_data)];

        const faces = [
            [[0, 0, 1], [1, 1, 0]],
            [[0, 0, -1], [1, 1, 0]],
            [[0, 1, 0], [1, 0, 1]],
            [[0, -1, 0], [1, 0, 1]],
            [[1, 0, 0], [0, 1, 1]],
            [[-1, 0, 0], [0, 1, 1]]
        ]
        const anchor_data: number[][][] = [];
        for (let y = 0; y < 256; ++y) {
            const row: number[][] = [];
            for (let x = 0; x < 256; ++x) {
                const face = faces[Math.floor(Math.random() * faces.length)];
                row.push([
                    face[1][0] * (2.0 * Math.random() - 1.0) + face[0][0],
                    face[1][1] *  (2.0 * Math.random() - 1.0) + face[0][1],
                    face[1][2] * (2.0 * Math.random() - 1.0) + face[0][2],
                    1.0]);
            }
            anchor_data.push(row);
        }
        this.anchor_tex = createIndexedStateTexture(this.gl, anchor_data);

        const velocity_data: number[][][] = [];
        for (let y = 0; y < 256; ++y) {
            const row: number[][] = [];
            for (let x = 0; x < 256; ++x) {
                row.push([0.0, 0.0, 0.0, 1.0]);
            }
            velocity_data.push(row);
        }
        this.velocity_tex = [createIndexedStateTexture(this.gl, velocity_data), createIndexedStateTexture(this.gl, velocity_data)];

        for (let i = 0; i < this.simulation_framebuffers.length; ++i) {
            const framebuffer = this.simulation_framebuffers[i];

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.position_tex[i], 0);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.velocity_tex[i], 0);
            const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
            gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        }
    }

    public async loadModel(path: string) {
        if (this.loaded_models.has(path)) {
            return;
        }

        this.loaded_models.add(path);

        const mesh = await importGLB(path);
        if (mesh === null) {
            return;
        }

        const face_areas = [];
        let total_area = 0;
        for (let index = 0; index < mesh.indices.length; index += 3) {
            const v0 = mesh.vertices[mesh.indices[index]].position;
            const v1 = mesh.vertices[mesh.indices[index + 1]].position;
            const v2 = mesh.vertices[mesh.indices[index + 2]].position;

            const x = vec3.sub(vec3.create(), v1, v0);
            const y = vec3.sub(vec3.create(), v2, v0);

            const a = vec3.dist(v0, v1);
            const b = vec3.dist(v0, v2);
            const c = vec3.dist(v1, v2);

            const s = 0.5 * (a + b + c);
            const face_area = Math.sqrt(s * (s - a) * (s - b) * (s - c))

            // const area_mat = mat3.fromValues(
            //     x[0], y[0], 1,
            //     x[1], y[1], 1,
            //     x[2], y[2], 1
            // );
            // const face_area = Math.abs(0.5 * mat3.determinant(area_mat))
            face_areas.push(face_area);
            total_area += face_area;
        }

        const anchor_data: number[][][] = [];
        for (let y = 0; y < 256; ++y) {
            const row: number[][] = [];
            for (let x = 0; x < 256; ++x) {
                let face_index = 0;

                let selected_area = Math.random() * total_area;
                while (selected_area > face_areas[face_index] && face_index < face_areas.length - 1) {
                    selected_area -= face_areas[face_index];
                    face_index += 1;
                }

                let index = 3 * face_index;

                const vertex = mesh.vertices[index];
                const v0 = mesh.vertices[mesh.indices[index]].position;
                const v1 = mesh.vertices[mesh.indices[index + 1]].position;
                const v2 = mesh.vertices[mesh.indices[index + 2]].position;

                const r1 = Math.random();
                const r2 = Math.random();

                const p = vec3.add(vec3.create(), vec3.add(vec3.create(), 
                        vec3.scale(vec3.create(), v0, (1 - Math.sqrt(r1))),
                        vec3.scale(vec3.create(), v1, Math.sqrt(r1) * (1 - r2))),
                        vec3.scale(vec3.create(), v2, r2 * Math.sqrt(r1)))

                row.push([
                    p[0],
                    p[1],
                    p[2],
                    1.0]);
            }
            anchor_data.push(row);
        }
        this.anchor_tex = createIndexedStateTexture(this.gl, anchor_data);
    }

    public frame(frame_params: FrameParams) {

        const gl = this.gl;

        this.simulation_program.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.simulation_framebuffers[frame_params.write_index]);
        
        gl.viewport(0, 0, 256, 256);
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.colorMask(true, true, true, true);
        gl.clear(gl.COLOR_BUFFER_BIT);
        

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.position_tex[frame_params.read_index]);
        gl.uniform1i(this.simulation_program.uniforms.position_tex, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.velocity_tex[frame_params.read_index]);
        gl.uniform1i(this.simulation_program.uniforms.velocity_tex, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.anchor_tex);
        gl.uniform1i(this.simulation_program.uniforms.anchor_tex, 2);

        
        

        gl.uniform1f(this.simulation_program.uniforms.dt, frame_params.dt);
        gl.uniform1f(this.simulation_program.uniforms.time, frame_params.now % 100.0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);



        this.particle_program.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, frame_params.framebuffer);

        gl.viewport(0, 0, frame_params.viewport.width, frame_params.viewport.height);
        
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.depthRange(0.0, 1.0);
        // gl.clearColor(0.75, 0.80, 0.85, 1.0);
        // gl.clearDepth(1.0);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.depthMask(false);
        gl.colorMask(true, true, true, true);
        gl.disable(gl.CULL_FACE);

        gl.uniformMatrix4fv(this.particle_program.uniforms.projection, false, frame_params.projection);
        gl.uniformMatrix4fv(this.particle_program.uniforms.perspective, false, frame_params.perspective);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.position_tex[frame_params.write_index]);
        gl.uniform1i(this.particle_program.uniforms.position_tex, 0);

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 256 * 256);
    }
}
