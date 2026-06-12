import { mat4, vec4, vec3, mat3, vec2 } from "gl-matrix";
import { ParticleField } from "./particle-field";
import { GlassText } from "./glass-text";
import { SmokeBackground } from "./smoke-background";
import { createBlankTexture, createFramebuffer } from "./gl-util";
import { GlassSphere } from "./glass-sphere";

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
    framebuffer: WebGLFramebuffer | null;
    scene_texture: WebGLTexture | null;
}

export interface GraphicsStage {
    frame(params: FrameParams): void;
}

export interface DrawQueue {
    particle_field: {path: string, scale: vec3, translate: vec3}[],
    glass_text: {
        text: {text: string, invert: boolean}[]
    }
}

export class Camera {
    public eye_pos = vec3.fromValues(1, 0, 0); 
    public look_pos = vec3.fromValues(0, 0, 0);
    public eye_dir = vec3.fromValues(1, 0, 0);
    public projection = mat4.identity(mat4.create()); 
    public perspective = mat4.identity(mat4.create()); 

    public constructor(private viewport: Viewport) {
    }

    public frame(now: number) {
        now = 0.0;
        this.eye_pos = vec3.fromValues(3.0 * Math.sin(0.1 * now / 1000.0), 1.0, 3.0 * Math.cos(0.1 * now / 1000.0));
        this.look_pos = vec3.fromValues(0.0, 0.0, 0.0);
        this.eye_dir = vec3.sub(vec3.create(), this.look_pos, this.eye_pos);
        vec3.normalize(this.eye_dir, this.eye_dir);
        this.projection = mat4.lookAt(mat4.create(), this.eye_pos, this.look_pos, [0, 1, 0]);
        this.perspective = mat4.perspective(mat4.create(), (0.25 * Math.PI), this.viewport.width / this.viewport.height, 0.01, 100.0);
        
    }

    public toWorldRay(screen_ray: vec2) {
        const transform = mat4.mul(mat4.create(), this.perspective, this.projection);
        const inv_transform = mat4.invert(mat4.create(), transform);
        if (inv_transform === null) {
            throw new Error("Couldn't invert projection matrix");
        }
        const near_plane_point = vec3.transformMat4(vec3.create(), vec3.fromValues(screen_ray[0], screen_ray[1], 1.0), inv_transform);
        const ray_dir = vec3.sub(vec3.create(), near_plane_point, this.eye_pos);
        vec3.normalize(ray_dir, ray_dir);
        const ray_start = this.eye_pos;

        console.log(`Screen: ${printVec3([screen_ray[0], screen_ray[1], 0.0])};     Camera pos: ${printVec3(this.eye_pos)};    Camera dir: ${printVec3(this.eye_dir)};   Ray start: ${printVec3(ray_start)};    Ray dir: ${printVec3(ray_dir)}`);
        return [ray_start, ray_dir] as [vec4, vec4];
    }
}

function printVec3(v: vec3) {
    return `${v[0].toFixed(2)},${v[1].toFixed(2)},${v[2].toFixed(2)}`
}
export class Graphics {
    private readonly gl: WebGL2RenderingContext;
    public viewport: Viewport = {width: 0, height: 0};
    private last_time: number;
    private frame_index = 0;
    private particle_field: ParticleField;
    private glass_text: GlassText;
    private smoke_background: SmokeBackground;
    private scene_framebuffer: WebGLFramebuffer;
    private scene_texture: WebGLTexture;
    private glass_sphere: GlassSphere;
    public camera: Camera;

    constructor(private canvas: HTMLCanvasElement, private navigate: (path: string) => void) {
        this.last_time = performance.now();

        this.gl = this.configureGl(canvas);
        this.viewport = this.configureViewport(canvas);
        this.camera = new Camera(this.viewport);

        if (!this.gl.getExtension('EXT_color_buffer_float')) {
            console.error('Rendering to floating point textures is not supported');
        }

        this.smoke_background = new SmokeBackground(this.gl, this.viewport);
        this.particle_field = new ParticleField(this.gl, this.viewport);
        this.glass_text = new GlassText(this.gl, this.viewport);
        this.glass_sphere = new GlassSphere(this.gl, this.viewport, navigate);

        this.scene_framebuffer = createFramebuffer(this.gl);
        this.scene_texture = createBlankTexture(this.gl, this.viewport.width, this.viewport.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.scene_framebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.scene_texture, 0);
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
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
            this.particle_field.loadModel(draw_queue.particle_field)
        }
        
        const now = performance.now();
        const dt = Math.max(1.0/30.0, (now - this.last_time) / 1000.0);
        this.last_time = now;

        const read_index = this.frame_index % 2;
        const write_index = 1 - read_index;

        this.camera.frame(now);

        const frame_params: FrameParams = {
            read_index,
            write_index,
            frame_index: this.frame_index,
            dt,
            now,
            eye_pos: this.camera.eye_pos,
            eye_dir: this.camera.eye_dir,
            projection: this.camera.projection,
            perspective: this.camera.perspective,
            viewport: this.viewport,
            framebuffer: this.scene_framebuffer,
            scene_texture: null
        }

        this.smoke_background.frame(frame_params);
        this.particle_field.frame(frame_params);

        frame_params.framebuffer = null;
        frame_params.scene_texture = this.scene_texture;
        this.glass_text.frame(frame_params, draw_queue.glass_text.text);
        this.glass_sphere.frame(frame_params);

        this.frame_index += 1;
    }

    
}
