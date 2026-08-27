import "./css/tokens.css";
import "./css/base.css";
import "./css/auth.css";

import {
  initRedefinirSenhaPage,
} from "./js/redefinir-senha-page.js";


function iniciarPaginaRedefinirSenha() {
  initRedefinirSenhaPage()
    .catch(
      (error) => {
        console.error(
          "[YXZ] Erro ao inicializar a recuperação de senha:",
          error,
        );
      },
    );
}


document.addEventListener(
  "DOMContentLoaded",
  iniciarPaginaRedefinirSenha,
);