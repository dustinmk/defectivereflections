import { mat4, vec4, vec3, mat3 } from "gl-matrix";
import { createFramebuffer, createIndexedStateTexture, createPNGTexture, createProgram, loadJSONFile, ShaderProgram } from "./gl-util";
import glass_text_vs from "./glass-text.vs.glsl";
import glass_text_fs from "./glass-text.fs.glsl";
import { FrameParams } from "./graphics";

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

export class GlassText {
    private glass_text_program: ShaderProgram;
    private mtsdf_tex: WebGLTexture;
    private font_atlas: FontAtlas | null = null;

    constructor(private readonly gl: WebGL2RenderingContext) {
        this.glass_text_program = createProgram(this.gl, {
            vs_source: glass_text_vs,
            fs_source: glass_text_fs,
            attrib: [],
            uniform: ["mtsdf_tex", "rect", "glyph_rects", "char_rects", "char_count"]
        });

        this.mtsdf_tex = createPNGTexture(this.gl, "/assets/font.png");
        loadJSONFile("/assets/font.json").then(result => this.font_atlas = result);
    }

    public frame(frame_params: FrameParams, text: string) {
        if (!this.font_atlas) {
            return;
        }

        const gl = this.gl;

        this.glass_text_program.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // // gl.viewport(0, 0, frame_params.viewport.width, frame_params.viewport.height);
        
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.depthRange(0.0, 1.0);
        // // gl.clearColor(0.75, 0.80, 0.85, 1.0);
        // // gl.clearDepth(1.0);
        // // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        // // gl.depthMask(false);
        // // gl.colorMask(true, true, true, true);
        // // gl.disable(gl.CULL_FACE);

        gl.uniform4f(this.glass_text_program.uniforms.rect, 0.0, 0.8, 0.2, 0.2);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.mtsdf_tex);
        gl.uniform1i(this.glass_text_program.uniforms.mtsdf_tex, 0);

        const glyph_rects: number[][] = [];
        const char_rects: number[][] = [];

        const glyph_map = new Map<number, Glyph>();
        for (const glyph of this.font_atlas.glyphs) {
            glyph_map.set(glyph.unicode, glyph);
        }

        const kerning_map = new Map<number, Map<number, number>>();
        for (const kerning of this.font_atlas.kerning) {
            if (!kerning_map.has(kerning.unicode1)) {
                kerning_map.set(kerning.unicode1, new Map());
            }

            const advance_map = kerning_map.get(kerning.unicode1);
            advance_map?.set(kerning.unicode2, kerning.advance);
        }

        let h_cursor = 0;
        let v_cursor = 0;
        const em = 0.015;

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
            const y = v_cursor + (em * glyph.planeBounds.bottom);
            const w = (h_cursor + (em * glyph.planeBounds.right)) - x;
            const h = (v_cursor + (em * glyph.planeBounds.top)) - y;
            char_rects.push([
                x,
                y,
                w,
                h,
            ]);

            h_cursor += em * glyph.advance;

            glyph_rects.push([
                glyph.atlasBounds.left / this.font_atlas.atlas.width,
                1.0 - glyph.atlasBounds.bottom / this.font_atlas.atlas.height,
                glyph.atlasBounds.right / this.font_atlas.atlas.width,
                1.0 - glyph.atlasBounds.top / this.font_atlas.atlas.height,
            ]);
        }

        gl.uniform4fv(this.glass_text_program.uniforms.glyph_rects, glyph_rects.flat(), 0, 0);
        gl.uniform4fv(this.glass_text_program.uniforms.char_rects, char_rects.flat(), 0, 0);
        gl.uniform1i(this.glass_text_program.uniforms.char_count, text.length);

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, text.length);
    }
}
