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


import {
  initSidebar,
} from "./js/ui.js";


import {
  initFeedback,
} from "./js/feedback.js";


import {
  initLogoutButtons,
  PERMISSIONS,
  renderAuthenticatedUser,
  requireAuth,
  requirePermission,
  requireUserManagementPermission,
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


/* =========================================================
   APP
========================================================= */

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


function getCurrentPage() {
  return (
    document.body.dataset
      .appPage ||
    "dashboard"
  );
}


/* =========================================================
   AUTORIZAÇÃO DA PÁGINA
========================================================= */

function authorizeCurrentPage(
  page,
) {
  if (
    page ===
    "usuarios"
  ) {
    return (
      requireUserManagementPermission()
    );
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


  return true;
}


/* =========================================================
   MÓDULOS DAS PÁGINAS
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
  }
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function iniciarAplicacao() {
  try {
    const user =
      await requireAuth();


    if (!user) {
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

    } catch (erro) {

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