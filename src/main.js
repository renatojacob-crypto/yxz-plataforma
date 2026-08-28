/* =========================================================
   YXZ PLATAFORMA
   ENTRY POINT
========================================================= */


/* =========================================================
   CSS
========================================================= */

import "./css/tokens.css";
import "./css/base.css";
import "./css/components.css";
import "./css/forms.css";
import "./css/tables.css";
import "./css/feedback.css";
import "./css/app.css";
import "./css/usuarios.css";
import "./css/instrutores.css";
import "./css/agendamentos.css";
import "./css/escalas.css";
import "./css/execucoes.css";
import "./css/horas.css";


/* =========================================================
   INTERFACE
========================================================= */

import {
  initSidebar,
} from "./js/ui.js";


import {
  renderSidebar,
} from "./js/sidebar.js";


import {
  initFeedback,
} from "./js/feedback.js";


/* =========================================================
   AUTENTICAÇÃO
========================================================= */

import {
  initLogoutButtons,
  PERMISSIONS,
  renderAuthenticatedUser,
  requireAuth,
  requirePermission,
  requireUserManagementPermission,
  watchAuthState,
} from "./js/auth.js";


/* =========================================================
   AUXILIAR
========================================================= */

function inicializarModulo(
  nome,
  callback,
) {
  try {

    return callback();

  } catch (
    erro
  ) {

    console.error(
      `[YXZ] Erro ao inicializar o módulo "${nome}":`,
      erro,
    );


    return null;
  }
}


/* =========================================================
   APP
========================================================= */

function mostrarAplicacao() {
  const appShell =
    document.querySelector(
      "[data-app-shell]",
    );


  if (
    !appShell
  ) {
    return;
  }


  appShell.hidden =
    false;
}


function getCurrentPage() {
  return (
    document.body.dataset
      .appPage ||
    "dashboard"
  );
}


/* =========================================================
   AUTORIZAÇÃO
========================================================= */

function authorizeCurrentPage(
  page,
) {
  if (
    page ===
    "usuarios"
  ) {
    return requireUserManagementPermission();
  }


  if (
    page ===
    "instrutores"
  ) {
    return requirePermission(
      PERMISSIONS
        .SCHEDULES_MANAGE,
    );
  }


  if (
    page ===
    "agendamentos"
  ) {
    return requirePermission(
      PERMISSIONS
        .WORKSHOPS_VIEW,
    );
  }


  if (
    page ===
    "escalas"
  ) {
    return requirePermission(
      PERMISSIONS
        .SCHEDULES_VIEW,
    );
  }


  if (
    page ===
    "execucoes"
  ) {
    return requirePermission(
      PERMISSIONS
        .WORKSHOPS_REGISTER_EXECUTION,
    );
  }


  if (
    page ===
    "horas"
  ) {
    return requirePermission(
      PERMISSIONS
        .SCHEDULES_VIEW,
    );
  }


  return true;
}


/* =========================================================
   PÁGINAS
========================================================= */

async function iniciarPaginaAtual() {
  const page =
    getCurrentPage();


  if (
    page ===
    "usuarios"
  ) {
    const {
      initUsuariosPage,
    } =
      await import(
        "./js/usuarios-page.js"
      );


    await initUsuariosPage();


    return;
  }


  if (
    page ===
    "instrutores"
  ) {
    const {
      initInstrutoresPage,
    } =
      await import(
        "./js/instrutores-page.js"
      );


    await initInstrutoresPage();


    return;
  }


  if (
    page ===
    "agendamentos"
  ) {
    const {
      initAgendamentosPage,
    } =
      await import(
        "./js/agendamentos-page.js"
      );


    await initAgendamentosPage();


    return;
  }


  if (
    page ===
    "escalas"
  ) {
    const {
      initEscalasPage,
    } =
      await import(
        "./js/escalas-page.js"
      );


    await initEscalasPage();


    return;
  }


  if (
    page ===
    "execucoes"
  ) {
    const {
      initExecucoesPage,
    } =
      await import(
        "./js/execucoes-page.js"
      );


    await initExecucoesPage();


    return;
  }


  if (
    page ===
    "horas"
  ) {
    const {
      initHorasPage,
    } =
      await import(
        "./js/horas-page.js"
      );


    await initHorasPage();


    return;
  }
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function iniciarAplicacao() {
  try {

    const user =
      await requireAuth();


    if (
      !user
    ) {
      return;
    }


    const page =
      getCurrentPage();


    if (
      !authorizeCurrentPage(
        page,
      )
    ) {
      return;
    }


    inicializarModulo(
      "Renderização da Sidebar",
      renderSidebar,
    );


    renderAuthenticatedUser(
      user,
    );


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


    try {

      await iniciarPaginaAtual();

    } catch (
      erro
    ) {

      console.error(
        "[YXZ] Erro ao inicializar a página atual:",
        erro,
      );
    }


    if (
      import.meta.env.DEV
    ) {
      console.info(
        `YXZ Plataforma 2.0 carregada: ${page}.`,
      );
    }

  } catch (
    erro
  ) {

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