import React from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export type ModalRender = () => React.ReactElement;
export type ModalServiceHandler = (render: ModalRender | null) => void;

export class ModalService {
    private _on_show: null | ModalServiceHandler = null;

    public show(render: ModalRender) {
        if (this._on_show !== null) {
            this._on_show(render);
        }
    }

    public dismiss() {
        if (this._on_show !== null) {
            this._on_show(null);
        }
    }

    public subscribe(handler: ModalServiceHandler) {
        this._on_show = handler;
    }

    public unsubscribe() {
        this._on_show = null;
    }
}

export const modal_service = new ModalService();

export const Modal = () => {
    const [show, setShow] = React.useState<null | ModalRender>(null);

    React.useEffect(() => {
        modal_service.subscribe(render => {
            setShow(() => render)
        });

        return () => {
            modal_service.unsubscribe();
        }
    });

    if (show === null) {
        return <></>
    }

    return <div className="modal" onClick={() => modal_service.dismiss()}>
        <div className="modal__content" onClick={evt => evt.stopPropagation()}>
            {show()}
        </div>
    </div>
}

export const confirmModal = (message: string) => {
    return new Promise<void>((resolve, reject) => modal_service.show(() => {
        return <>
            <h3>Confirm?</h3>
            <p>{message}</p>
            <button onClick={() => {resolve(); modal_service.dismiss()}}>Okay</button>
            <button onClick={() => {reject(); modal_service.dismiss()}}>Cancel</button>
        </>
    }));
}