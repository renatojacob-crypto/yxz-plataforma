import "./css/tokens.css";
import "./css/base.css";
import "./css/auth.css";

import {
  initLoginPage,
} from "./js/login-page.js";


function iniciarLogin() {
  initLoginPage()
    .catch((error) => {
      console.error(
        "[YXZ] Erro ao inicializar login:",
        error,
      );
    });
}


document.addEventListener(
  "DOMContentLoaded",
  iniciarLogin,
);