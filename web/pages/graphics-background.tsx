import { vec2, vec3 } from "gl-matrix";
import React from "react";
import { useNavigate } from "react-router";
import { Graphics } from "web/graphics/graphics";

const link_assets = [
    {link: "/articles/all/game%20design", label: ["Game Engine", "&Design"], model: "/assets/tank.glb", scale: 0.35, center: [1.5, 0.2, 0]},
    {link: "/articles/review/music", label: ["Music", "Reviews"], model: "/assets/piano.glb", scale: 0.35, center: [0.2, 0.2, 1.5]},
    {link: "/articles/poetry/all", label: ["Poetry", "&Literature"], model: "/assets/scroll.glb", scale: 0.35, center: [0.2, 0.2, 1.5]},
    {link: "/articles/research/philosophy", label: ["Philosophy", "&Research"], model: "/assets/books.glb", scale: 0.35, center: [0.2, 0.2, 1.5]},
    {link: "/articles/all/programming", label: ["Algorithms", "&Programming"], model: "/assets/computer.glb", scale: 0.35, center: [0.2, 0.2, 1.5]},
    {link: "/articles/essay/all", label: ["Personal", "&Essays"], model: "/assets/window.glb", scale: 0.35, center: [0.2, 0.2, 1.5]},
];

for (let i = 0; i < link_assets.length; i++) {
    const step_angle = 2.0 * Math.PI / link_assets.length;
    link_assets[i].center = [
        Math.cos(step_angle * i),
        0.1,
        Math.sin(step_angle * i)
    ]
}

let pause = localStorage.getItem("pause") === "true" || false;

const center_asset = {link: "/articles", center: [0.0, 0.0, 0.0], scale: 0.3}
class GraphicsBackground {
    private graphics: Graphics;
    private mouse_pos: [number, number] = [0.0, 0.0];
    private halt = false;
    private current_logo_text = ["defective", "reflections"];
    private base_logo_text = ["defective", "reflections"];

    public constructor(
        private canvas: HTMLCanvasElement,
        private navigate: (path: string) => void
    ) {
        this.graphics = new Graphics(canvas);

        document.body.addEventListener("mousemove", evt => {
            this.mouse_pos = [
                evt.clientX / document.body.clientWidth * 2.0 - 1.0,
                -1.0 * (evt.clientY / document.body.clientHeight * 2.0 - 1.0)
            ];
        });

        document.body.addEventListener("touchstart", evt => {
            evt.preventDefault();
            
            const touch = evt.touches.item(0);
            if (touch !== null) {
                this.mouse_pos = [
                    touch.clientX / document.body.clientWidth * 2.0 - 1.0,
                    -1.0 * (touch.clientY / document.body.clientHeight * 2.0 - 1.0)
                ];
            }
        })

        document.body.addEventListener("touchmove", evt => {
            evt.preventDefault();

            const touch = evt.touches.item(0);
            if (touch !== null) {
                this.mouse_pos = [
                    touch.clientX / document.body.clientWidth * 2.0 - 1.0,
                    -1.0 * (touch.clientY / document.body.clientHeight * 2.0 - 1.0)
                ];
            }
        })

        document.body.addEventListener("touchend", evt => {

        })

        document.body.addEventListener("touchcancel", evt => {

        })

        document.body.addEventListener("click", evt => {
            if ((evt.target as HTMLElement).closest(".app__content") && !(evt.target as HTMLElement).classList.contains("app__content")) {
                return;
            }
            
            for (const path of [center_asset, ...link_assets]) {
                if (this.mouseIntersects(path.center, path.scale)) {
                    navigate(path.link);
                }
            }
        })

        window.requestAnimationFrame(() => this.frame());
    }

    private mouseIntersects(center: vec3, radius: number) {
        const [ray_start, ray_dir] = this.graphics.camera.toWorldRay(this.mouse_pos);
        const a = vec3.dot(ray_dir, ray_dir);
        const origin_center = vec3.sub(vec3.create(), ray_start, center);
        const b = 2.0 * vec3.dot(ray_dir, origin_center);
        const c = vec3.dot(origin_center, origin_center) - radius * radius;
        const discriminant = b * b - 4.0 * a * c;
        return discriminant > 0.0;
    }

    public frame() {
        let intersect: boolean = false;
        let asset_index = 1;
        let highlighted_asset_index: number | null = null;
        for (const asset of link_assets) {
            if (this.mouseIntersects(asset.center, 0.3)) {
                intersect = true;
                highlighted_asset_index = asset_index;
            }

            asset_index += 1;
        }

        if (intersect || this.mouseIntersects(center_asset.center, center_asset.scale)) {
            document.body.style.cursor = "pointer";
        } else {
            document.body.style.cursor = "auto";
        }

        const now = performance.now() / 1000.0;
        if (Math.floor(now) % 4.0 === 0.0) {
            if (this.current_logo_text[0] === this.base_logo_text[0] && this.current_logo_text[1] === this.base_logo_text[1]) {
                const line_index = Math.floor(Math.random() * 1.99999);
                const letter_index = Math.floor(Math.random() * this.base_logo_text[line_index].length - 0.0000001);
                this.current_logo_text[line_index] = this.base_logo_text[line_index].slice(0, letter_index) + this.base_logo_text[line_index].slice(letter_index + 1, this.base_logo_text[line_index].length);
            }
        } else {
            this.current_logo_text = [...this.base_logo_text]
        }

        this.graphics.frame({
            mouse_pos: this.mouse_pos,
            particle_field: {
                assets: [
                    {path: "/assets/terrain2.glb", scale: [1.0, 1.0, 1.0], translate: [0, 0, 0]},
                    ...link_assets.map(asset => ({
                        path: asset.model,
                        scale: [asset.scale, asset.scale, asset.scale],
                        translate: asset.center
                    }))
                ],
                highlighted_asset_index,
                mouse_ray: this.graphics.camera.toWorldRay(this.mouse_pos)
            },
            glass_text: [
                {
                    lines: [
                        {text: this.current_logo_text[0], invert: false},
                        {text: this.current_logo_text[1], invert: true}
                    ],
                    em: 4.0,
                    bottom_left: [0.01, 0.01]
                },
                ...link_assets.map(asset => {
                    const calcHeight = (pos: vec3) => {
                        const world_bottom = vec3.add(vec3.create(), pos, vec3.fromValues(0.0, 0.0, 0.0));
                        const world_top = vec3.add(vec3.create(), pos, vec3.fromValues(0.0, 0.05, 0.0));
                        const bottom_center = this.graphics.camera.toScreenPos(world_bottom);
                        const top_center = this.graphics.camera.toScreenPos(world_top);
                        return top_center[1] - bottom_center[1];
                    }
                    const height_ratio = calcHeight(asset.center) / calcHeight([0, 0, 0])
                    const em = 1.5 * height_ratio
                    const bottom_center = this.graphics.camera.toScreenPos([asset.center[0], asset.center[1] + 0.3, asset.center[2]]);
                    return {
                        lines: asset.label.map(label => ({text: label, invert: false})),
                        em,
                        bottom_center: [0.5 * (bottom_center[0] + 1.0), 0.5 * (bottom_center[1] + 1.0)]
                    }
                })
            ]
        });

        if (!this.halt && !pause) {
            window.requestAnimationFrame(() => this.frame());
        }
    }

    public doHalt() {
        this.halt = true;
        pause = true;
    }
}

export default function() {
    const navigate = useNavigate();
    const graphics_canvas = React.useRef<HTMLCanvasElement>(null);
    const [graphics_background, setGraphicsBackground] = React.useState<GraphicsBackground | null>(null);
    const [internalPause, setInternalPause] = React.useState(pause);

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

    return <>
        <canvas ref={graphics_canvas} style={{width: "100%", height: "100%", zIndex: -100, position: "fixed"}} />
        <button
            style={{position: "absolute", zIndex: "10000"}}
            onClick={() => {
                if (!pause) {
                    pause = true;
                    setInternalPause(pause);
                    localStorage.setItem("pause", "true");
                } else {
                    pause = false;
                    setInternalPause(pause);
                    localStorage.setItem("pause", "false");
                    graphics_background && graphics_background.frame()
                }
            }}
        >
            {!internalPause && <i className="fa-solid fa-pause"></i>}
            {internalPause && <i className="fa-solid fa-play"></i>}
        </button>
    </>;
}