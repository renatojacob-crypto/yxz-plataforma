import "./css/tokens.css";
import "./css/base.css";
import "./css/components.css";
import "./css/forms.css";
import "./css/tables.css";
import "./css/feedback.css";
import "./css/app.css";

import {
  initSidebar,
} from "./js/ui.js";

import {
  initFeedback,
} from "./js/feedback.js";

import {
  initLogoutButtons,
  renderAuthenticatedUser,
  requireAuth,
  watchAuthState,
} from "./js/auth.js";


function inicializarModulo(
  nome,
  callback,
) {
  try {
    return callback();
  } catch (erro) {
    console.error(
      `[YXZ] Erro ao inicializar o módulo "${nome}":`,
      erro,
    );

    return null;
  }
}


function mostrarAplicacao() {
  const appShell =
    document.querySelector(
      "[data-app-shell]",
    );

  if (!appShell) {
    return;
  }

  appShell.hidden =
    false;
}


async function iniciarAplicacao() {
  try {

    /*
     * Primeiro validamos a sessão.
     *
     * Enquanto isso, o app-shell
     * permanece com hidden.
     */
    const user =
      await requireAuth();


    /*
     * Se não houver usuário,
     * requireAuth() já iniciou
     * o redirecionamento para login.
     */
    if (!user) {
      return;
    }


    /*
     * Agora podemos inserir os dados
     * do usuário autenticado.
     */
    renderAuthenticatedUser(
      user,
    );


    /*
     * Somente após a autenticação
     * mostramos o portal.
     */
    mostrarAplicacao();


    inicializarModulo(
      "Sidebar",
      initSidebar,
    );


    inicializarModulo(
      "Feedback",
      initFeedback,
    );


    inicializarModulo(
      "Logout",
      initLogoutButtons,
    );


    inicializarModulo(
      "Monitor de autenticação",
      watchAuthState,
    );


    if (import.meta.env.DEV) {
      console.info(
        "YXZ Plataforma 2.0 carregada para usuário autenticado.",
      );
    }

  } catch (erro) {

    console.error(
      "[YXZ] Não foi possível iniciar o portal:",
      erro,
    );


    window.location.replace(
      "/app/login.html",
    );
  }
}


document.addEventListener(
  "DOMContentLoaded",
  iniciarAplicacao,
);