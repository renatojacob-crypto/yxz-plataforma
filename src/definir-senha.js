import "./css/tokens.css";
import "./css/base.css";
import "./css/auth.css";

import {
  initDefinirSenhaPage,
} from "./js/definir-senha-page.js";


function iniciarPaginaDefinirSenha() {
  initDefinirSenhaPage()
    .catch(
      (error) => {
        console.error(
          "[YXZ] Erro ao inicializar a página de definição de senha:",
          error,
        );
      },
    );
}


document.addEventListener(
  "DOMContentLoaded",
  iniciarPaginaDefinirSenha,
);