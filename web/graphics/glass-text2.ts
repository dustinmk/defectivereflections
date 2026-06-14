import { mat4, vec4, vec3, mat3, vec2 } from "gl-matrix";
import { createBlankTexture, createBlankTextureR8, createDepthTexture, createFramebuffer, createIndexedStateTexture, createPNGTexture, createProgram, loadJSONFile, ShaderProgram } from "./gl-util";
import glass_text_vs from "./glass-text2.vs.glsl";
import glass_text_fs from "./glass-text2.fs.glsl";
import sdf_composite_vs from "./sdf-composite.vs.glsl";
import sdf_composite_fs from "./sdf-composite.fs.glsl";
import { FrameParams, Viewport } from "./graphics";

// Create rendering pipeline and draw quad to start
// Then load in a mesh
// Then add particles into a series of textures and use a vertex shader to render quads in their position
// Include position, velocity and gravity point, as well as fixed forces from motion or cursor
// Add after effects like trails, glow, regional colour

// This is a really thin and not really re-usable piece of code, specifically for this one purpose. Consider refactoring/
// borrowing from other projects if need more complexity

interface Glyph {
    unicode: number;
    advance: number;
    planeBounds: {
        left: number;
        bottom: number;
        right: number;
        top: number;
    },
    atlasBounds: {
        left: number;
        bottom: number;
        right: number;
        top: number;
    }
}

interface FontAtlas {
    atlas: {
        type: "string",
        distanceRange: number;
        distanceRangeMiddle: number;
        size: number;
        width: number;
        height: number;
        yOrigin: string;
        grid: {
            cellWidth: number;
            cellheight: number;
            columns: number;
            rows: number;
            originY: number;
        }
    }
    metrics: {
        emSize: number;
        lineHeight: number;
        ascender: number;
        descender: number;
        underlineY: number;
        underlineThickness: number;
    }
    glyphs: Glyph[];
    kerning: {
        unicode1: number;
        unicode2: number;
        advance: number;
    }[];
}

export interface TextLine {
    text: string
    invert: boolean
}

export interface GlassTextInstance {
    em: number;
    top_left?: vec2;
    bottom_center?: vec2;
    lines: {text: string, invert: boolean}[];
}

export class GlassText2 {
    private glass_text_program: ShaderProgram;
    private sdf_composite_program: ShaderProgram;
    private mtsdf_tex: WebGLTexture;
    private font_atlas: FontAtlas | null = null;
    private sdf_framebuffer: WebGLFramebuffer;
    private sdf_framebuffer_tex: WebGLTexture;
    private sdf_framebuffer_depth: WebGLTexture;
    private mouse_pos = [0.0, 0.0];

    constructor(private readonly gl: WebGL2RenderingContext, viewport: Viewport) {
        this.glass_text_program = createProgram(this.gl, {
            vs_source: glass_text_vs,
            fs_source: glass_text_fs,
            attrib: [],
            uniform: ["mtsdf_tex", "scene_tex", "rect", "glyph_rects", "char_rects", "char_count", "time", "mouse_pos", "resolution"]
        });

        this.sdf_composite_program = createProgram(this.gl, {
            vs_source: sdf_composite_vs,
            fs_source: sdf_composite_fs,
            attrib: [],
            uniform: ["mtsdf_tex", "scene_tex", "rect", "glyph_rects", "char_rects", "char_count", "time", "mouse_pos"]
        });

        this.sdf_framebuffer = createFramebuffer(this.gl);
        this.sdf_framebuffer_tex = createBlankTextureR8(gl, viewport.width, viewport.height);
        this.sdf_framebuffer_depth = createDepthTexture(gl, viewport.width, viewport.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.sdf_framebuffer);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            this.sdf_framebuffer_tex,
            0);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.DEPTH_ATTACHMENT,
            this.gl.TEXTURE_2D,
            this.sdf_framebuffer_depth,
            0);
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer is not complete");
        }

        this.mtsdf_tex = createPNGTexture(this.gl, "/assets/font.png");
        loadJSONFile("/assets/font.json").then(result => this.font_atlas = result);

        document.body.addEventListener("mousemove", evt => this.mouse_pos = [evt.clientX / document.body.clientWidth, 1.0 - evt.clientY / document.body.clientHeight]);
    }

    public frame(frame_params: FrameParams, text_instances: GlassTextInstance[]) {
    
        const gl = this.gl;

        const {glyph_rects, char_rects, char_count} = this.computeText(text_instances);

        this.sdf_composite_program.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.sdf_framebuffer);

        gl.viewport(0, 0, frame_params.viewport.width, frame_params.viewport.height);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);
        gl.depthRange(0.0, 1.0);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.blendEquation(gl.MAX);
        gl.blendFunc(gl.ONE, gl.ONE);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.mtsdf_tex);
        gl.uniform1i(this.sdf_composite_program.uniforms.mtsdf_tex, 0);
        
        gl.uniform4fv(this.sdf_composite_program.uniforms.glyph_rects, glyph_rects.flat(), 0, 0);
        gl.uniform4fv(this.sdf_composite_program.uniforms.char_rects, char_rects.flat(), 0, 0);     

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, char_count);



        this.glass_text_program.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, frame_params.framebuffer);
        gl.viewport(0, 0, frame_params.viewport.width, frame_params.viewport.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.depthRange(0.0, 1.0);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        gl.colorMask(true, true, true, true);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sdf_framebuffer_tex);
        gl.uniform1i(this.glass_text_program.uniforms.sdf_tex, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, frame_params.scene_texture);
        gl.uniform1i(this.glass_text_program.uniforms.scene_tex, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, frame_params.depth_texture);
        gl.uniform1i(this.glass_text_program.uniforms.depth_tex, 2);

        gl.uniform2f(this.glass_text_program.uniforms.mouse_pos, frame_params.mouse_pos[0], frame_params.mouse_pos[1]);
        gl.uniform1f(this.glass_text_program.uniforms.time, frame_params.now / 1000.0);
        gl.uniform2f(this.glass_text_program.uniforms.resolution, frame_params.viewport.width, frame_params.viewport.height);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    private computeText(text_instances: GlassTextInstance[]): {glyph_rects: number[][], char_rects: number[][], char_count: number} {
        if (!this.font_atlas) {
            return {
                glyph_rects: [],
                char_rects: [],
                char_count: 0
            }
        }

        const glyph_rects: number[][] = [];
        const char_rects: number[][] = [];
        let max_height: number = 0;

        const glyph_map = new Map<number, Glyph>();
        for (const glyph of this.font_atlas.glyphs) {
            glyph_map.set(glyph.unicode, glyph);
            const height = glyph.planeBounds.top - glyph.planeBounds.bottom;
            max_height = Math.max(max_height, height);
        }

        const kerning_map = new Map<number, Map<number, number>>();
        for (const kerning of this.font_atlas.kerning) {
            if (!kerning_map.has(kerning.unicode1)) {
                kerning_map.set(kerning.unicode1, new Map());
            }

            const advance_map = kerning_map.get(kerning.unicode1);
            advance_map?.set(kerning.unicode2, kerning.advance);
        }

        let char_count = 0;

        for (const text_instance of text_instances) {
            let h_cursor = 0;
            let v_cursor = 0;
            const em = text_instance.em / max_height;
            let line_widths: number[] = [];
            let total_height = 0;
            let total_width = 0;

            const text_lines = text_instance.lines;

            for (const line of text_lines) {
                const text = line.text;

                let line_width = 0;
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const char_code = char.charCodeAt(0);
                    const glyph = glyph_map.get(char_code);
                    if (!glyph) {
                        h_cursor += em;
                        continue;
                    }

                    if (i > 0) {
                        const advance_map = kerning_map.get(text.charCodeAt(i - 1));
                        if (advance_map !== undefined) {
                            const advance = advance_map.get(text.charCodeAt(i));
                            if (advance !== undefined) {
                                h_cursor += em * advance;
                            }
                        }
                    }

                    const x = h_cursor + (em * glyph.planeBounds.left);
                    const w = (h_cursor + (em * glyph.planeBounds.right)) - x;
                    h_cursor += em * glyph.advance;
                    line_width = h_cursor;
                }
                line_widths.push(line_width);
                total_width = Math.max(total_width, line_width);
                v_cursor -= em / max_height * (1 + this.font_atlas.metrics.lineHeight);
                h_cursor = 0;
            }

            total_height = text_lines.length * (em * max_height * (1 + this.font_atlas.metrics.lineHeight));

            let top_left: vec2 = [0.0, 0.0];
            if (text_instance.top_left) {
                top_left = text_instance.top_left;
            }
            else if (text_instance.bottom_center) {
                top_left = [
                    text_instance.bottom_center[0] - (total_width / 2.0),
                    text_instance.bottom_center[1] + total_height
                ];
            }

            h_cursor = top_left[0];
            v_cursor = top_left[1] - em * max_height * (1 + this.font_atlas.metrics.lineHeight);
            console.log(`${text_lines[0].text} POS: ${h_cursor} ${v_cursor}`)
            for (let line_index = 0; line_index < text_lines.length; line_index++) {
                const line = text_lines[line_index];
                const text = line.text;
                const line_width = line_widths[line_index];
                const line_offset = (total_width - line_width) / 2.0;

                if (!line.invert) {
                    h_cursor = top_left[0] + line_offset;
                } else {
                    h_cursor = top_left[0] + total_width - line_offset
                }

                const text_dir = line.invert ? -1.0 : 1.0;
                
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    char_count += 1;

                    const char_code = char.charCodeAt(0);
                    const glyph = glyph_map.get(char_code);
                    if (!glyph) {
                        h_cursor += text_dir * em;
                        continue;
                    }

                    if (i > 0) {
                        const advance_map = kerning_map.get(text.charCodeAt(i - 1));
                        if (advance_map !== undefined) {
                            const advance = advance_map.get(text.charCodeAt(i));
                            if (advance !== undefined) {
                                h_cursor += text_dir * em * advance;
                            }
                        }
                    }

                    if (!line.invert) {
                        const x = h_cursor + (em * glyph.planeBounds.left);
                        const y = v_cursor + (em * glyph.planeBounds.bottom);
                        const w = ((h_cursor + (em * glyph.planeBounds.right)) - x);
                        const h = (v_cursor + (em * glyph.planeBounds.top)) - y;
                        char_rects.push([
                            x,
                            y,
                            w,
                            h,
                        ]);
                    } else {
                        const x = h_cursor - (em * glyph.planeBounds.left);
                        const y = v_cursor + (em * glyph.planeBounds.bottom);
                        const w = (h_cursor - (em * glyph.planeBounds.right)) - x;
                        const h = (v_cursor + (em * glyph.planeBounds.top)) - y;
                        char_rects.push([
                            x,
                            y,
                            w,
                            h,
                        ]);
                    }

                    h_cursor += text_dir * em * glyph.advance;

                    if (!line.invert) {
                        glyph_rects.push([
                            glyph.atlasBounds.left / this.font_atlas.atlas.width,
                            1.0 - glyph.atlasBounds.bottom / this.font_atlas.atlas.height,
                            glyph.atlasBounds.right / this.font_atlas.atlas.width,
                            1.0 - glyph.atlasBounds.top / this.font_atlas.atlas.height,
                        ]);
                    } else {
                        glyph_rects.push([
                            glyph.atlasBounds.left / this.font_atlas.atlas.width,
                            1.0 - glyph.atlasBounds.top / this.font_atlas.atlas.height,
                            glyph.atlasBounds.right / this.font_atlas.atlas.width,
                            1.0 - glyph.atlasBounds.bottom / this.font_atlas.atlas.height
                        ]);
                    }
                }

                v_cursor -= em * (1 + this.font_atlas.metrics.lineHeight);
                h_cursor = 0;
            }
        }

        return {
            glyph_rects,
            char_rects,
            char_count
        }
    }
}
