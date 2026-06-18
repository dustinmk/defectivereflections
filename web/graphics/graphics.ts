import { mat4, vec4, vec3, mat3, vec2 } from "gl-matrix";
import { ParticleField } from "./particle-field";
import { GlassText } from "./glass-text";
import { SmokeBackground } from "./smoke-background";
import { createBlankTexture, createDepthTexture, createFramebuffer } from "./gl-util";
import { GlassSphere } from "./glass-sphere";
import { BlendQuad } from "./blend-quad";
import { BlitQuad } from "./blit-quad";
import { GlassText2, GlassTextInstance } from "./glass-text2";

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
    depth_texture: WebGLTexture | null;
    scene_texture: WebGLTexture | null;
    mouse_pos: [number, number];
}

export interface GraphicsStage {
    frame(params: FrameParams): void;
}

export interface DrawQueue {
    mouse_pos: [number, number],
    particle_field: {assets: {path: string, scale: vec3, translate: vec3}[], highlighted_asset_index: number | null, mouse_ray: [vec3, vec3]},
    glass_text: GlassTextInstance[]
}

export class Camera {
    public eye_pos = vec3.fromValues(1, 0, 0); 
    public look_pos = vec3.fromValues(0, 0, 0);
    public eye_dir = vec3.fromValues(1, 0, 0);
    public projection = mat4.identity(mat4.create()); 
    public perspective = mat4.identity(mat4.create()); 

    public constructor(private viewport: Viewport) {
    }

    public resize(viewport: Viewport) {
        this.viewport = viewport;
    }

    public frame(now: number) {
        //now = 0.0;
        const aspect = this.viewport.width / this.viewport.height;
        this.eye_pos = vec3.fromValues(3.0 * Math.sin(0.1 * now / 1000.0), 2.0 / aspect, 3.0 * Math.cos(0.1 * now / 1000.0));
        this.look_pos = vec3.fromValues(0.0, 0.0, 0.0);
        this.eye_dir = vec3.sub(vec3.create(), this.look_pos, this.eye_pos);
        vec3.normalize(this.eye_dir, this.eye_dir);
        this.projection = mat4.lookAt(mat4.create(), this.eye_pos, this.look_pos, [0, 1, 0]);

        const angle = Math.tan(1.5 / vec3.len(this.eye_pos));
        this.perspective = mat4.perspective(mat4.create(), angle * 2.0 / aspect, aspect, 0.01, 100.0);
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

        return [ray_start, ray_dir] as [vec4, vec4];
    }

    public toScreenPos(world_pos: vec3) {
        const transform = mat4.mul(mat4.create(), this.perspective, this.projection);
        return vec3.transformMat4(vec3.create(), world_pos, transform);
    }
}

export class Graphics {
    private readonly gl: WebGL2RenderingContext;
    public viewport: Viewport = {width: 0, height: 0};
    private last_time: number;
    private frame_index = 0;
    private particle_field: ParticleField;
    private glass_text2: GlassText2;
    private glass_sphere: GlassSphere;
    private blend_quad: BlendQuad;
    private blit_quad: BlitQuad;
    private smoke_background: SmokeBackground;

    private particle_framebuffer: WebGLFramebuffer;
    private particle_texture: WebGLTexture;
    private particle_depth: WebGLTexture;
    private smoke_framebuffer: WebGLFramebuffer;
    private smoke_texture: WebGLTexture;
    private scene_framebuffer: WebGLFramebuffer;
    private scene_texture: WebGLTexture;
    private refract_base_framebuffer: WebGLFramebuffer;
    private refract_base_texture: WebGLTexture;
    private refract_base_depth: WebGLTexture;
    public camera: Camera;

    constructor(private canvas: HTMLCanvasElement) {
        this.last_time = performance.now();

        this.gl = this.configureGl(canvas);
        this.viewport = this.configureViewport(canvas);
        this.camera = new Camera(this.viewport);

        if (!this.gl.getExtension('EXT_color_buffer_float')) {
            console.error('Rendering to floating point textures is not supported');
        }

        this.smoke_background = new SmokeBackground(this.gl);
        this.particle_field = new ParticleField(this.gl);
        this.glass_text2 = new GlassText2(this.gl, this.viewport);
        this.glass_sphere = new GlassSphere(this.gl);
        this.blend_quad = new BlendQuad(this.gl);
        this.blit_quad = new BlitQuad(this.gl);

        [this.particle_framebuffer, this.particle_texture, this.particle_depth] = this.createParticleFramebuffer(this.viewport);
        [this.smoke_framebuffer, this.smoke_texture] = this.createSmokeFramebuffer(this.viewport);
        [this.scene_framebuffer, this.scene_texture] = this.createSceneFramebuffer(this.viewport);
        [this.refract_base_framebuffer, this.refract_base_texture, this.refract_base_depth] = this.createRefractBaseFramebuffer(this.viewport);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        window.addEventListener("resize", () => {
            this.viewport = this.configureViewport(this.canvas);
            this.camera.resize(this.viewport);
            this.glass_text2.resize(this.viewport);

            [this.particle_framebuffer, this.particle_texture, this.particle_depth] = this.createParticleFramebuffer(this.viewport);
            [this.smoke_framebuffer, this.smoke_texture] = this.createSmokeFramebuffer(this.viewport);
            [this.scene_framebuffer, this.scene_texture] = this.createSceneFramebuffer(this.viewport);
            [this.refract_base_framebuffer, this.refract_base_texture, this.refract_base_depth] = this.createRefractBaseFramebuffer(this.viewport);
        })
    }

    private createParticleFramebuffer(viewport: Viewport) {
        const particle_framebuffer = createFramebuffer(this.gl);
        const particle_texture = createBlankTexture(this.gl, viewport.width, viewport.height);
        const particle_depth = createDepthTexture(this.gl, viewport.width, viewport.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, particle_framebuffer);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            particle_texture,
            0);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.DEPTH_ATTACHMENT,
            this.gl.TEXTURE_2D,
            particle_depth,
            0);
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer is not complete");
        }

        return [particle_framebuffer, particle_texture, particle_depth]
    }

    private createSmokeFramebuffer(viewport: Viewport) {
        const smoke_framebuffer = createFramebuffer(this.gl);
        const smoke_texture = createBlankTexture(this.gl, viewport.width / 8.0, viewport.height / 8.0);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, smoke_framebuffer);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            smoke_texture,
            0);
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer is not complete");
        }

        return [smoke_framebuffer, smoke_texture]
    }

    private createSceneFramebuffer(viewport: Viewport) {
        const scene_framebuffer = createFramebuffer(this.gl);
        const scene_texture = createBlankTexture(this.gl, viewport.width, viewport.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, scene_framebuffer);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            scene_texture,
            0);
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer is not complete");
        }

        return [scene_framebuffer, scene_texture];
    }

    private createRefractBaseFramebuffer(viewport: Viewport) {
        const refract_base_framebuffer = createFramebuffer(this.gl);
        const refract_base_texture = createBlankTexture(this.gl, viewport.width, viewport.height);
        const refract_base_depth = createDepthTexture(this.gl, viewport.width, viewport.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, refract_base_framebuffer);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            refract_base_texture,
            0);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.DEPTH_ATTACHMENT,
            this.gl.TEXTURE_2D,
            refract_base_depth,
            0);
        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer is not complete");
        }
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);

        return [refract_base_framebuffer, refract_base_texture, refract_base_depth];
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
            this.particle_field.loadModel(draw_queue.particle_field.assets)
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
            depth_texture: null,
            scene_texture: null,
            mouse_pos: draw_queue.mouse_pos
        }

        frame_params.framebuffer = this.smoke_framebuffer;
        this.smoke_background.frame(frame_params);

        frame_params.framebuffer = this.particle_framebuffer;
        this.particle_field.frame(frame_params, draw_queue.particle_field.highlighted_asset_index, draw_queue.particle_field.mouse_ray);

        frame_params.framebuffer = this.scene_framebuffer;// this.scene_framebuffer;
        this.blend_quad.frame(frame_params, this.smoke_texture, this.particle_texture);

        frame_params.framebuffer = this.refract_base_framebuffer;
        frame_params.depth_texture = this.particle_depth;
        frame_params.scene_texture = this.scene_texture;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.refract_base_framebuffer);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.blit_quad.frame(frame_params, this.smoke_texture);
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.scene_framebuffer);
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, null);
        this.glass_sphere.frame(frame_params);
        this.blit_quad.frame(frame_params, this.particle_texture, this.particle_depth);

        frame_params.scene_texture = this.refract_base_texture;
        frame_params.framebuffer = null;
        this.blit_quad.frame(frame_params, this.refract_base_texture);
        this.glass_text2.frame(frame_params, draw_queue.glass_text);
        
        
        this.frame_index += 1;
    }

    
}
