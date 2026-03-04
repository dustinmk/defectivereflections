import { mat4, vec4, vec3 } from "gl-matrix";

// Create rendering pipeline and draw quad to start
// Then load in a mesh
// Then add particles into a series of textures and use a vertex shader to render quads in their position
// Include position, velocity and gravity point, as well as fixed forces from motion or cursor
// Add after effects like trails, glow, regional colour

// This is a really thin and not really re-usable piece of code, specifically for this one purpose. Consider refactoring/
// borrowing from other projects if need more complexity

export class ParticleField {
    private readonly gl: WebGLRenderingContext;
    private viewport: {width: number, height: number} = {width: 0, height: 0};

    constructor(private canvas: HTMLCanvasElement) {
        this.gl = <WebGLRenderingContext>canvas.getContext("webgl");
        if (this.gl === null) {
            this.gl = <WebGLRenderingContext>canvas.getContext("experimental-webgl");
        }
        this.viewport = {
            width: canvas.clientWidth,
            height: canvas.clientHeight
        };

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        window.onresize = () => {
            this.viewport.width = canvas.clientWidth;
            this.viewport.height = canvas.clientHeight;
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }

        const ext = this.gl.getExtension('OES_texture_float');
        if (ext === null) {
            throw new Error("WebGL extension OES_texture_float is required");
        }
    }

    public frame() {
        this.render();
    }

    private render() {
        const gl = this.gl;

        gl.viewport(0, 0, this.viewport.width, this.viewport.height);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.depthRange(0.0, 1.0);
        gl.clearColor(0.02, 0.05, 0.15, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.colorMask(true, true, true, true);

        const eye_pos = vec3.fromValues(4.0, 4.0, -4.0);
        const look_pos = vec3.fromValues(0.0, 0.0, 0.0);
        const eye_dir = vec3.sub(vec3.create(), look_pos, eye_pos);
        const projection = mat4.lookAt(mat4.create(), eye_pos, look_pos, [0, 1, 0]);
        const perspective = mat4.ortho(
            mat4.create(),
            -4.0,
            4.0,
            -4.0 * this.viewport.height / this.viewport.width,
            4.0 * this.viewport.height / this.viewport.width,
            -100.0,
            100.0);
    }
}