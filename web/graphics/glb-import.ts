import { access } from "fs";
import { file } from "web/api/api";

interface GLBHeader {
    extensionsUsed: string[],
    extensionsRequired: string[],
    accessors: Array<
        {
            bufferView?: number,
            byteOffset?: number,
            componentType: number,
            normalized?: boolean,
            count: number,
            type: string,
            max?: number,
            min?: number,
            sparse?: {
                count: number,
                indices: {
                    bufferView: number,
                    byteOffset?: number,
                    componentType: number,
                    extensions?: {},
                    extras?: {}
                },
                values: {
                    bufferView: number,
                    byteOffset?: number,
                    extensions?: {},
                    extras?: {}
                },
                extensions?: {

                },
                extras?: {}
            },
            name?: string,
            extensions?: {},
            extras?: {}
        }
    >,
    animations: Array<
        {
            channels: Array<{
                sampler: number,
                target: {
                    node: number,
                    path: string,
                    extensions?: {}
                    extras?: {}
                },
                extensions?: {}
                extras?: {}
            }>,
            samplers: Array<{
                input: number,
                interpolation: string,
                output: number,
                extensions?: {}
                extras?: {}
            }>,
            name: string,
            extensions?: {}
            extras?: {}
        }
    >,
    asset: {
        copyright?: string,
        generator?: string,
        version: string,
        minVersion?: string,
        extensions?: {}
        extras?: {}
    },
    buffers: Array<{
        uri?: string,
        byteLength: number,
        name?: string,
        extensions?: {}
        extras?: {}
    }>,
    bufferViews: Array<{
        buffer: number,
        byteOffset?: number,
        byteLength: number,
        byteStride?: number,
        target?: number,
        name?: string,
        extensions?: {}
        extras?: {}
    }>,
    cameras: Array<{
        orthographic?: {
            xmag: number,
            ymag: number,
            zfar: number,
            znear: number,
            extensions?: {}
            extras?: {}
        },
        perspective?: {
            aspectRatio?: number,
            yfov: number,
            zfar?: number,
            znear: number,
            extensions?: {}
            extras?: {}
        },
        type: string,
        name?: string,
        extensions?: {}
        extras?: {}
    }>,
    images: Array<{
        uri?: string,
        mimeType?: string,
        bufferView?: number,
        name?: string,
        extensions?: {}
        extras?: {}
    }>,
    materials: Array<{
        name?: string,
        extensions?: {}
        extras?: {},
        pbrMetallicRoughness?: {
            baseColorFactor: number[],
            baseColorTexture: {
                index: number,
                texCoord?: number,
                extensions?: {}
                extras?: {}
            },
            metallicFactor: number,
            roughnessFactor: number,
            metallicRoughnessTexture: {
                index: number,
                texCoord?: number,
                extensions?: {}
                extras?: {}
            },
            extensions?: {}
            extras?: {}
        },
        normalTexture?: {
            index: number,
            texCoord?: number,
            scale?: number,
            extensions?: {}
            extras?: {}
        },
        occlusionTexture?: {
            index: number,
            texCoord?: number
            strength?: number,
            extensions?: {}
            extras?: {}
        },
        emissiveTexture?: {
            index: number,
            texCoord?: number,
            extensions?: {}
            extras?: {}
        },
        emissiveFactor?: number[],
        alphaMode?: string,
        alphaCutoff?: number,
        doubleSided?: boolean
    }>,
    meshes: Array<{
        primitives: Array<{
            attributes: {[index: string]: number},
            indices?: number,
            material?: number,
            mode?: number,
            targets?: Array<{}>,
            extensions?: {}
            extras?: {}
        }>,
        weights?: number[],
        name?: string
        index: number,
        extensions?: {}
        extras?: {}
    }>,
    nodes: Array<{
        camera?: number,
        children?: number[],
        skin?: number,
        matrix?: number,
        mesh?: number,
        rotation?: number[],
        scale?: number[],
        translation?: number[],
        weights?: number[],
        name?: string,
        extensions?: {}
        extras?: {}
    }>,
    samplers: Array<{
        magFilter?: number,
        minFilter?: number,
        wrapS?: number,
        wrapT?: number,
        name?: string,
        extensions?: {}
        extras?: {}
    }>,
    scene: number,
    scenes: Array<{
        nodes?: number[],
        name?: string,
        extensions?: {}
        extras?: {}
    }>,
    skins: Array<{
        inverseBindMatrices?: number,
        skeleton?: number,
        joints: number[],
        name?: string,
        extensions?: {}
        extras?: {}
    }>,
    textures: Array<{
        sampler?: number,
        source?: number,
        name?: string,
        extensions?: {}
        extras?: {}
    }>,
    extensions?: {[index: string]: any}
    extras?: {}
}

const ComponentType = {
    BYTE: 5120,
    UNSIGNED_BYTE: 5121,
    SHORT: 5122,
    UNSIGNED_SHORT: 5123,
    UNSIGNED_INT: 5125,
    FLOAT: 5126
}

export async function importGLB(path: string) {
    const result = await fetch(path, {method: "GET", mode: "cors"});
    const content = await result.arrayBuffer();

    const dv = new DataView(content);
    const magic = dv.getUint32(0, true);
    const version  = dv.getUint32(4, true);
    const length  = dv.getUint32(8, true);

    if (magic !== 0x46546c67) {
        throw new Error("Not a valid GLB file");
    }

    if (version !== 2) {
        throw new Error(`Unsupported GLB version: ${version}`);
    }

    if (length !== content.byteLength) {
        throw new Error("GLB length mismatch");
    }

    let offset = 12;
    const chunk_length = dv.getUint32(offset, true);
    const chunk_type = dv.getUint32(offset + 4, true);
    const chunk_data  = new Uint8Array(content, offset + 8, chunk_length);

    if (chunk_type !== 0x4E4F534A) {
        throw new Error("Invalid GLB JSON location");
    }

    const json_text = new TextDecoder().decode(chunk_data);
    const json = JSON.parse(json_text) as GLBHeader;

    offset += 8;
    offset += chunk_length;

    const binary_length = dv.getUint32(offset, true);
    const binary_type = dv.getUint32(offset + 4, true);
    const binary_content = content.slice(offset + 8);
    const data_offset = offset + 8;

    const indices: number[] = [];
    const vertices: {position: number[], normal: number[], tangent: number[], tex: number[]}[] = [];
    const meshes: {
        index_offset: number,
        vertex_offset: number
    }[] = [];

    const scene = json.scenes[json.scene];
    if (scene.nodes === undefined) {
        return null;
    }

    for (const node_index of scene.nodes) {
        const node = json.nodes[node_index];
        if (node.mesh !== undefined) {
            for (const primitive of json.meshes[node.mesh].primitives) {
                const vertices_base = vertices.length;
                const indices_base = indices.length;
                meshes.push({
                    index_offset: indices_base,
                    vertex_offset: vertices_base
                });

                if (primitive.indices !== undefined) {
                    const accessor = json.accessors[primitive.indices || 0];
                    const buffer_view = json.bufferViews[accessor.bufferView || 0];
                    const byte_offset = (accessor.byteOffset || 0) + (buffer_view.byteOffset || 0);
                    const buffer = json.buffers[buffer_view.buffer];
                    if (accessor.componentType === ComponentType.UNSIGNED_SHORT) {
                        for (let count = 0; count < accessor.count; ++count) {
                            indices.push(vertices_base + dv.getUint16(data_offset + byte_offset + (count * 2), true));
                        }
                    } else if (accessor.componentType === ComponentType.UNSIGNED_INT) {
                        for (let count = 0; count < accessor.count; ++count) {
                            indices.push(vertices_base + dv.getUint32(data_offset + byte_offset + (count * 4), true));
                        }
                    }
                }

                for (const attribute in primitive.attributes) {
                    
                    const accessor_index = primitive.attributes[attribute];
                    const accessor = json.accessors[accessor_index];

                    if (vertices.length <= vertices_base + accessor.count) {
                        for (let i = vertices.length; i < vertices_base + accessor.count; ++i) {
                            vertices.push({position: [], normal: [], tangent: [], tex: []});
                        }
                    }

                    const buffer_view = json.bufferViews[accessor.bufferView || 0];
                    const byte_offset = (accessor.byteOffset || 0) + (buffer_view.byteOffset || 0);
                    const buffer = json.buffers[buffer_view.buffer];
                    
                    let stride = 1;
                    if (accessor.type === "VEC2") {
                        stride = 2;
                    }
                    else if (accessor.type === "VEC3") {
                        stride = 3;
                    }
                    else if (accessor.type === "VEC4") {
                        stride = 4;
                    }

                    let step_size = 4;
                    if (accessor.componentType === ComponentType.FLOAT) {
                        step_size = 4;
                    }

                    let vertex_attribute = "";
                    if (attribute === "POSITION") {
                        vertex_attribute = "position";
                    }
                    else if (attribute === "NORMAL") {
                        vertex_attribute = "normal";
                    }
                    else if (attribute === "TANGENT") {
                        vertex_attribute = "tangent";
                    }
                    else if (attribute === "TEXCOORD_0") {
                        vertex_attribute = "tex";
                    }

                    for (let i = 0; i < accessor.count; i++) {
                        for (let step = 0; step < stride; step++) {
                            const value = dv.getFloat32(data_offset + byte_offset + (step_size * stride * i) + (step * step_size), true);
                            (vertices[vertices_base + i] as {[index: string]: number[]})[vertex_attribute][step] = value;
                        }
                    }
                }
            }
        }
    }

    const vertex_stride = 3 + 3 + 4 + 2;
    const vertex_data = new Float32Array(vertices.length * (3 + 3 + 4 + 2));
    for (let i = 0; i < vertices.length; ++i) {
        vertex_data[i * vertex_stride + 0] = vertices[i].position[0] || 0;
        vertex_data[i * vertex_stride + 1] = vertices[i].position[1] || 0;
        vertex_data[i * vertex_stride + 2] = vertices[i].position[2] || 0;
        vertex_data[i * vertex_stride + 3] = vertices[i].normal[0] || 0;
        vertex_data[i * vertex_stride + 4] = vertices[i].normal[1] || 0;
        vertex_data[i * vertex_stride + 5] = vertices[i].normal[2] || 0;
        vertex_data[i * vertex_stride + 6] = vertices[i].tangent[0] || 0;
        vertex_data[i * vertex_stride + 7] = vertices[i].tangent[1] || 0;
        vertex_data[i * vertex_stride + 8] = vertices[i].tangent[2] || 0;
        vertex_data[i * vertex_stride + 9] = vertices[i].tangent[3] || 0;
        vertex_data[i * vertex_stride + 10] = vertices[i].tex[0] || 0;
        vertex_data[i * vertex_stride + 11] = vertices[i].tex[1] || 0;
    }

    const index_data = indices.length < Math.pow(2, 16) ? new Uint16Array(indices) : new Uint32Array(indices);

    return {
        index_stride: indices.length < Math.pow(2, 16) ? 2 : 4,
        vertex_stride: 4 * vertex_stride,
        vertex_data,
        index_data,
        meshes,
        indices,
        vertices
    }
}

