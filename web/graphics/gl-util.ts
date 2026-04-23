import { flattenBitmapData } from "web/util";

export type ShaderProgram = ReturnType<typeof createProgram>;

export interface AttribSpec {
    name: string,
    size: number,
    type: number
}

export function createProgram(gl: WebGLRenderingContext, args: {
    vs_source: string,
    fs_source: string,
    attrib: AttribSpec[],
    uniform: string[]
}) {
    const program = createShaderProgram(gl, args.vs_source, args.fs_source);
    const attrib_indexes: {[index: string]: number} = {};
    args.attrib.forEach(attrib_value => attrib_indexes[attrib_value.name] = gl.getAttribLocation(program, attrib_value.name));
    const uniforms: {[index: string]: WebGLUniformLocation | null} = {};
    args.uniform.forEach(uniform_name => uniforms[uniform_name] = gl.getUniformLocation(program, uniform_name));
    const stride = args.attrib.reduce((sum, attrib_value) => {
        return sum + typeToSize(gl, attrib_value.type) * attrib_value.size;
    }, 0);

    return {
        program,
        attrib_indexes,
        uniforms,
        use: () => {
            gl.useProgram(program);
            let offset = 0;
            args.attrib.forEach(attrib_value => {
                const attrib_index = attrib_indexes[attrib_value.name];
                gl.vertexAttribPointer(attrib_index, attrib_value.size, attrib_value.type, false, stride, offset);
                gl.enableVertexAttribArray(attrib_index);
                offset += typeToSize(gl, attrib_value.type) * attrib_value.size;
            });
        },
        cleanup: () => {
            Object.values(attrib_indexes).forEach(attrib_index => gl.disableVertexAttribArray(attrib_index));
        }
    }
}

export function createShaderProgram(gl: WebGLRenderingContext, vs_source: string, fs_source: string) {

    let vs: WebGLShader | null = null;
    let fs: WebGLShader | null = null;

    try {
        vs = loadShader(gl, vs_source, gl.VERTEX_SHADER);
        fs = loadShader(gl, fs_source, gl.FRAGMENT_SHADER);
    } catch (err) {
        vs !== null && gl.deleteShader(vs);
        fs !== null && gl.deleteShader(fs);
        throw err;
    }
    
    const program = gl.createProgram();
    if (program === null) {
        throw new Error("Could not create shader program");
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    return program;
}

export function loadShader(gl: WebGLRenderingContext, source: string, type: number) {
    
    const shader = gl.createShader(type);
    if (shader === null) {
        throw new Error("Could not create shader");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!status) {
        const message = `Couldn't compile shader: ${gl.getShaderInfoLog(shader)}`;
        gl.deleteShader(shader);
        throw new Error(message);
    }

    return shader;
}

export function typeToSize(gl: WebGLRenderingContext, type: number) {
    switch(type) {
        case gl.BYTE:
        case gl.UNSIGNED_BYTE:
            return 1;
        case gl.SHORT:
        case gl.UNSIGNED_SHORT:
            return 2;
        case gl.FLOAT:
            return 4;
    }
    return 1;
}

export function createBuffer(gl: WebGLRenderingContext, data: number[]) {
    const buffer = gl.createBuffer();
    if (buffer === null) {
        throw new Error("Couldn't create particle buffer");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return buffer;
}

export function createIndexedStateTexture(gl: WebGL2RenderingContext, data: number[][][]) {
    const tex = gl.createTexture();
    if (tex === null) {
        throw new Error("Couldn't create texture.");
    }

    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32F,
        data[0].length,
        data.length,
        0,
        gl.RGBA,
        gl.FLOAT,
        new Float32Array(flattenBitmapData(data))
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);

    return tex;
}

export function bindTextures(
    gl: WebGLRenderingContext,
    textures: Array<{loc: WebGLUniformLocation | null, tex: WebGLTexture}>
) {
    const tex_slots = [
        gl.TEXTURE0,
        gl.TEXTURE1,
        gl.TEXTURE2,
        gl.TEXTURE3,
        gl.TEXTURE4,
        gl.TEXTURE5,
        gl.TEXTURE6,
        gl.TEXTURE7,
        gl.TEXTURE8,
        gl.TEXTURE9,
        gl.TEXTURE10,
        gl.TEXTURE11,
        gl.TEXTURE12,
        gl.TEXTURE13,
        gl.TEXTURE14,
        gl.TEXTURE15,
        gl.TEXTURE16,
        gl.TEXTURE17,
        gl.TEXTURE18,
        gl.TEXTURE19,
        gl.TEXTURE20
    ];

    for(let tex_index = 0; tex_index < textures.length; ++tex_index) {
        gl.activeTexture(tex_slots[tex_index]);
        gl.bindTexture(gl.TEXTURE_2D, textures[tex_index].tex);
        gl.uniform1i(textures[tex_index].loc, tex_index);
    }
}

export function createElementBuffer(gl: WebGLRenderingContext, data: number[]) {
    const buffer = gl.createBuffer();
    if (buffer === null) {
        throw new Error("Couldn't create particle buffer");
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return buffer;
}

export function createFramebuffer(gl: WebGLRenderingContext) {
    const fb = gl.createFramebuffer();
    if (fb === null) {
        throw new Error("Couldn't create framebuffer");
    }

    return fb;
}