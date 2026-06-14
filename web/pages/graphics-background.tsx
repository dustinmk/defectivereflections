import { vec2, vec3 } from "gl-matrix";
import React from "react";
import { useNavigate } from "react-router";
import { Graphics } from "web/graphics/graphics";

const link_assets = [
    {link: "/articles", label: "Games", model: "/assets/tank1.glb", scale: 0.35, center: [1.5, 0.2, 0]}
];

class GraphicsBackground {
    private graphics: Graphics;
    private mouse_pos: [number, number] = [0.0, 0.0];
    private halt = false;

    public constructor(
        private canvas: HTMLCanvasElement,
        private navigate: (path: string) => void
    ) {
        this.graphics = new Graphics(canvas, navigate);

        document.body.addEventListener("mousemove", evt => {
            this.mouse_pos = [
                evt.clientX / document.body.clientWidth * 2.0 - 1.0,
                -1.0 * (evt.clientY / document.body.clientHeight * 2.0 - 1.0)
            ];
        });

        document.body.addEventListener("click", evt => {
            const mouse_range = vec2.length(vec2.sub(vec2.create(), this.mouse_pos, [0.0, 0.0]));
            if (mouse_range <= 0.1 * this.graphics.viewport.width / this.graphics.viewport.height) {
                navigate("/articles");
            }
        })

        window.requestAnimationFrame(() => this.frame());
    }

    public frame() {
        let intersect: boolean = false;
        for (const asset of link_assets) {
            const radius = 0.3;
            const [ray_start, ray_dir] = this.graphics.camera.toWorldRay(this.mouse_pos);
            const a = vec3.dot(ray_dir, ray_dir);
            const origin_center = vec3.sub(vec3.create(), ray_start, asset.center);
            const b = 2.0 * vec3.dot(ray_dir, origin_center);
            const c = vec3.dot(origin_center, origin_center) - radius * radius;
            const discriminant = b * b - 4.0 * a * c;
            if (discriminant > 0.0) {
                const sqrt_discriminant = Math.sqrt(discriminant);
                const t0 = (-b + sqrt_discriminant) / (2.0 * a);
                const t1 = (-b - sqrt_discriminant) / (2.0 * a);
                const t = t0 < t1 ? t0 : t1;
                const intersection = vec3.scaleAndAdd(vec3.create(), ray_start, ray_dir, t);
                intersect = true;
            }
        }

        if (intersect) {
            document.body.style.cursor = "pointer";
        } else {
            document.body.style.cursor = "auto";
        }

        this.graphics.frame({
            mouse_pos: this.mouse_pos,
            particle_field: [
                {path: "/assets/terrain1.glb", scale: [1.0, 1.0, 1.0], translate: [0, 0, 0]},
                ...link_assets.map(asset => ({
                    path: asset.model,
                    scale: [asset.scale, asset.scale, asset.scale],
                    translate: asset.center
                }))
            ],
            glass_text: [
                {
                    lines: [
                        {text: "defective", invert: false},
                        {text: "reflections", invert: true}
                    ],
                    em: 0.05,
                    top_left: [0.01, 0.99]
                },
                ...link_assets.map(asset => {
                    const world_text_bottom = vec3.add(vec3.create(), asset.center, vec3.fromValues(0.0, 0.0, 0.0));
                    const world_text_top = vec3.add(vec3.create(), world_text_bottom, vec3.fromValues(0.0, 0.05, 0.0));
                    const bottom_center = this.graphics.camera.toScreenPos(world_text_bottom);
                    const top_center = this.graphics.camera.toScreenPos(world_text_top);
                    const em = top_center[1] - bottom_center[1];

                    return {
                        lines: [{text: asset.label, invert: false}],
                        em,
                        bottom_center: [0.5 * (bottom_center[0] + 1.0), 0.5 * (bottom_center[1] + 1.0)]
                    }
                })
            ]
        });

        if (!this.halt) {
            window.requestAnimationFrame(() => this.frame());
        }
    }

    public doHalt() {
        this.halt = true;
    }
}

export default function() {
    const navigate = useNavigate();
    const graphics_canvas = React.useRef<HTMLCanvasElement>(null);
    const [graphics_background, setGraphicsBackground] = React.useState<GraphicsBackground | null>(null);

    React.useEffect(() => {
        if (graphics_canvas.current !== null) {
            setGraphicsBackground(new GraphicsBackground(graphics_canvas.current, (path: string) => navigate(path)));
        }

        return () => {
            if (graphics_background) {
                graphics_background.doHalt();
            }
        }

    }, [graphics_canvas.current])

    return <canvas ref={graphics_canvas} style={{width: "100%", height: "100%", zIndex: -100, position: "fixed"}} />;
}