import { mat4, vec4, vec3, mat3 } from "gl-matrix";
import { ParticleField } from "./particle-field";
import { GlassText } from "./glass-text";

export interface Viewport {
    width: number;
    height: number;
}

export interface FrameParams {
    read_index: number;
    write_index: number;
    frame_index: number;
    dt: number;
    now: number;
    eye_pos: vec3;
    eye_dir: vec3;
    projection: mat4;
    perspective: mat4;
    viewport: Viewport;
}

export interface GraphicsStage {
    frame(params: FrameParams): void;
}

export interface DrawQueue {
    particle_field: string[],
    glass_text: {
        text: string
    }
}

export class Graphics {
    private readonly gl: WebGL2RenderingContext;
    private viewport: Viewport = {width: 0, height: 0};
    private last_time: number;
    private frame_index = 0;
    private particle_field: ParticleField;
    private glass_text: GlassText;

    constructor(private canvas: HTMLCanvasElement) {
        this.last_time = performance.now();

        this.gl = this.configureGl(canvas);
        this.viewport = this.configureViewport(canvas);

        if (!this.gl.getExtension('EXT_color_buffer_float')) {
            console.error('Rendering to floating point textures is not supported');
        }

        this.particle_field = new ParticleField(this.gl);
        this.glass_text = new GlassText(this.gl, this.viewport);
    }

    private configureGl(canvas: HTMLCanvasElement) {
        let gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
        if (gl === null) {
            gl = <WebGL2RenderingContext>canvas.getContext("experimental-webgl2");
        }

        return gl;
    }

    private configureViewport(canvas: HTMLCanvasElement) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        window.onresize = () => {
            this.viewport.width = canvas.clientWidth;
            this.viewport.height = canvas.clientHeight;
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }

        return {
            width: canvas.clientWidth,
            height: canvas.clientHeight
        };
    }

    public frame(draw_queue: DrawQueue) {
        if (draw_queue.particle_field !== undefined) {
            for (const path of draw_queue.particle_field) {
                this.particle_field.loadModel(path)
            }
        }
        
        const now = performance.now();
        const dt = (now - this.last_time) / 1000.0;
        this.last_time = now;

        const read_index = this.frame_index % 2;
        const write_index = 1 - read_index;

        const eye_pos = vec3.fromValues(2.0, 4.0 * Math.sin(0.1 * now / 1000.0), 2.0 * Math.cos(0.1 * now / 1000.0));
        //const eye_pos = vec3.fromValues(0.0, 0.0, -10.0);
        const look_pos = vec3.fromValues(0.0, 0.0, 0.0);
        const eye_dir = vec3.sub(vec3.create(), look_pos, eye_pos);
        const projection = mat4.lookAt(mat4.create(), eye_pos, look_pos, [0, 1, 0]);
        // const perspective = mat4.ortho(
        //     mat4.create(),
        //     -4.0,
        //     4.0,
        //     -4.0 * this.viewport.height / this.viewport.width,
        //     4.0 * this.viewport.height / this.viewport.width,
        //     -100.0,
        //     100.0);
        const perspective = mat4.perspective(mat4.create(), (0.25 * Math.PI), this.viewport.width / this.viewport.height, 0.01, 100.0);

        const frame_params: FrameParams = {
            read_index,
            write_index,
            frame_index: this.frame_index,
            dt,
            now,
            eye_pos,
            eye_dir,
            projection,
            perspective,
            viewport: this.viewport
        }

        this.particle_field.frame(frame_params);
        this.glass_text.frame(frame_params, draw_queue.glass_text.text);

        this.frame_index += 1;
    }
}
