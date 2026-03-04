import React from "react";
import { Outlet } from "react-router";
import { ParticleField } from "web/graphics/particle-field";

export default function() {
    const particle_field_canvas = React.useRef<HTMLCanvasElement>(null);
    const [particle_field, setParticleField] = React.useState<ParticleField | null>(null);

    React.useEffect(() => {

        // Callback boxing here to prevent memory leak after React component destroyed

        // Wrap in an object so function reference can be changed
        const callback = {
            frame: function() {
                if (particle_field) {
                    particle_field.frame();
                }

                // Set the function to null to break the callback loop
                if (this.frame !== null) {
                    window.requestAnimationFrame(this.frame);
                }
            }
        } as {frame: null | (() => void)};

        if (particle_field_canvas.current !== null) {
            setParticleField(new ParticleField(particle_field_canvas.current));

            // Initiate the loop
            if (callback.frame !== null) {
                window.requestAnimationFrame(callback.frame);
            }
        }

        return () => {
            // When the component is destroyed, set the callback to null
            // so that the loop is broken. If we only set a closure variable
            // to null, the closure variable is captured here and not in the 
            // callback chain
            callback.frame = null;
        }

    }, [particle_field_canvas.current])

    return <div className="app">
        <Outlet />
        <canvas ref={particle_field_canvas} style={{width: "100%", height: "100%", zIndex: -100, position: "fixed"}} />
    </div>
}