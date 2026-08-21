import "./css/tokens.css";
import "./css/base.css";
import "./css/components.css";
import "./css/app.css";

import { initSidebar } from "./js/ui.js";

document.addEventListener(
  "DOMContentLoaded",
  () => {
    initSidebar();

    console.log(
      "YXZ Plataforma 2.0 carregada.",
    );
  },
);