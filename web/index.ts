import "./index.scss";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "web/app";

import { enableMapSet } from "immer";

enableMapSet();

const root = document.createElement("div");
document.body.append(root);
root.classList.add("root");
ReactDOM.createRoot(root).render(App());
