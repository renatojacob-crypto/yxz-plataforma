import "./css/tokens.css";
import "./css/base.css";
import "./css/components.css";
import "./css/forms.css";
import "./css/tables.css";
import "./css/feedback.css";
import "./css/app.css";

import { initSidebar } from "./js/ui.js";
import { initFeedback } from "./js/feedback.js";

document.addEventListener(
  "DOMContentLoaded",
  () => {
    initSidebar();
    initFeedback();

    console.log(
      "YXZ Plataforma 2.0 carregada.",
    );
  },
);