import {
  supabase,
} from "./supabase.js";


const LOGIN_PATH =
  "/app/login.html";

const APP_PATH =
  "/app/";


/* =========================================================
   PERFIS
========================================================= */

export const USER_PROFILES = {
  MASTER:
    "administrador_master",

  ADMIN:
    "administrador",

  SOCIAL_EDUCATOR:
    "educador_social",

  COORDINATOR:
    "coordenador",

  INSTRUCTOR:
    "instrutor",
};


/* =========================================================
   PERMISSÕES
========================================================= */

export const PERMISSIONS = {

  /*
   * DASHBOARD
   */

  DASHBOARD_VIEW:
    "dashboard.visualizar",


  /*
   * OFICINAS
   */

  WORKSHOPS_VIEW:
    "oficinas.visualizar",

  WORKSHOPS_SCHEDULE:
    "oficinas.agendar",

  WORKSHOPS_RESCHEDULE:
    "oficinas.reagendar",

  WORKSHOPS_REGISTER_EXECUTION:
    "oficinas.registrar_execucao",


  /*
   * ESCALAS
   */

  SCHEDULES_VIEW:
    "escalas.visualizar",

  SCHEDULES_MANAGE:
    "escalas.gerenciar",


  /*
   * FINANCEIRO
   */

  EXPENSE_FORECAST_VIEW:
    "previsoes.visualizar",

  EXPENSE_FORECAST_MANAGE:
    "previsoes.gerenciar",

  EXPENSES_VIEW:
    "gastos.visualizar",

  EXPENSES_MANAGE:
    "gastos.gerenciar",


  /*
   * RELATÓRIOS
   */

  REPORTS_VIEW:
    "relatorios.visualizar",


  /*
   * USUÁRIOS
   */

  USERS_MANAGE:
    "usuarios.gerenciar",


  /*
   * INSTRUTOR
   */

  INSTRUCTOR_DASHBOARD:
    "instrutor.dashboard",
};


/* =========================================================
   MATRIZ DE PERMISSÕES
========================================================= */

const PROFILE_PERMISSIONS = {

  /*
   * ADMINISTRADOR MASTER
   *
   * O Master recebe acesso operacional
   * completo.
   *
   * Gestão de usuários ainda exige também:
   *
   * pode_gerenciar_usuarios = true
   */

  [USER_PROFILES.MASTER]:
    new Set([
      PERMISSIONS.DASHBOARD_VIEW,

      PERMISSIONS.WORKSHOPS_VIEW,
      PERMISSIONS.WORKSHOPS_SCHEDULE,
      PERMISSIONS.WORKSHOPS_RESCHEDULE,
      PERMISSIONS.WORKSHOPS_REGISTER_EXECUTION,

      PERMISSIONS.SCHEDULES_VIEW,
      PERMISSIONS.SCHEDULES_MANAGE,

      PERMISSIONS.EXPENSE_FORECAST_VIEW,
      PERMISSIONS.EXPENSE_FORECAST_MANAGE,

      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_MANAGE,

      PERMISSIONS.REPORTS_VIEW,

      PERMISSIONS.USERS_MANAGE,
    ]),


  /*
   * ADMINISTRADOR
   *
   * Tudo da operação, menos
   * gestão de usuários.
   */

  [USER_PROFILES.ADMIN]:
    new Set([
      PERMISSIONS.DASHBOARD_VIEW,

      PERMISSIONS.WORKSHOPS_VIEW,
      PERMISSIONS.WORKSHOPS_SCHEDULE,
      PERMISSIONS.WORKSHOPS_RESCHEDULE,
      PERMISSIONS.WORKSHOPS_REGISTER_EXECUTION,

      PERMISSIONS.SCHEDULES_VIEW,
      PERMISSIONS.SCHEDULES_MANAGE,

      PERMISSIONS.EXPENSE_FORECAST_VIEW,
      PERMISSIONS.EXPENSE_FORECAST_MANAGE,

      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_MANAGE,

      PERMISSIONS.REPORTS_VIEW,
    ]),


  /*
   * EDUCADOR SOCIAL
   */

  [USER_PROFILES.SOCIAL_EDUCATOR]:
    new Set([
      PERMISSIONS.DASHBOARD_VIEW,

      PERMISSIONS.WORKSHOPS_VIEW,
      PERMISSIONS.WORKSHOPS_SCHEDULE,
      PERMISSIONS.WORKSHOPS_RESCHEDULE,
    ]),


  /*
   * COORDENADOR
   */

  [USER_PROFILES.COORDINATOR]:
    new Set([
      PERMISSIONS.DASHBOARD_VIEW,

      PERMISSIONS.WORKSHOPS_VIEW,
      PERMISSIONS.WORKSHOPS_SCHEDULE,
      PERMISSIONS.WORKSHOPS_RESCHEDULE,
      PERMISSIONS.WORKSHOPS_REGISTER_EXECUTION,

      PERMISSIONS.SCHEDULES_VIEW,
      PERMISSIONS.SCHEDULES_MANAGE,

      PERMISSIONS.EXPENSE_FORECAST_VIEW,
      PERMISSIONS.EXPENSE_FORECAST_MANAGE,

      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_MANAGE,

      PERMISSIONS.REPORTS_VIEW,
    ]),


  /*
   * INSTRUTOR
   *
   * Não possui funções operacionais.
   *
   * Se futuramente receber login,
   * terá somente seu painel individual.
   */

  [USER_PROFILES.INSTRUCTOR]:
    new Set([
      PERMISSIONS.INSTRUCTOR_DASHBOARD,
    ]),
};


/* =========================================================
   ESTADO AUTENTICADO
========================================================= */

let authenticatedUser =
  null;

let authenticatedProfile =
  null;


/* =========================================================
   CAMINHOS
========================================================= */

function getCurrentInternalPath() {
  return (
    window.location.pathname +
    window.location.search +
    window.location.hash
  );
}


function buildLoginUrl({
  preserveNext = true,
  reason = "",
} = {}) {
  const params =
    new URLSearchParams();


  if (preserveNext) {
    params.set(
      "next",
      getCurrentInternalPath(),
    );
  }


  if (reason) {
    params.set(
      "reason",
      reason,
    );
  }


  const query =
    params.toString();


  return query
    ? `${LOGIN_PATH}?${query}`
    : LOGIN_PATH;
}


function redirectToLogin({
  preserveNext = true,
  reason = "",
} = {}) {
  window.location.replace(
    buildLoginUrl({
      preserveNext,
      reason,
    }),
  );
}


/* =========================================================
   NEXT SEGURO
========================================================= */

export function getSafeNextPath() {
  const params =
    new URLSearchParams(
      window.location.search,
    );


  const next =
    params.get("next");


  if (!next) {
    return APP_PATH;
  }


  if (
    !next.startsWith("/app/") ||
    next.startsWith("//")
  ) {
    return APP_PATH;
  }


  if (
    next.startsWith(
      "/app/login.html",
    )
  ) {
    return APP_PATH;
  }


  return next;
}


/* =========================================================
   AUTH USER
========================================================= */

export async function getAuthenticatedUser() {
  const {
    data,
    error,
  } =
    await supabase.auth.getUser();


  if (
    error ||
    !data?.user
  ) {
    return null;
  }


  return data.user;
}


/* =========================================================
   PROFILE
========================================================= */

export async function getUserProfile(
  userId,
) {
  if (!userId) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from("profiles")
      .select(`
        id,
        nome,
        email,
        cargo,
        perfil,
        ativo,
        avatar_url,
        pode_gerenciar_usuarios,
        created_at,
        updated_at
      `)
      .eq(
        "id",
        userId,
      )
      .maybeSingle();


  if (error) {
    throw error;
  }


  return data || null;
}


/* =========================================================
   ESTADO ATUAL
========================================================= */

export function getCurrentProfile() {
  return authenticatedProfile;
}


export function getCurrentUser() {
  return authenticatedUser;
}


/* =========================================================
   PERFIL
========================================================= */

export function hasProfile(
  ...allowedProfiles
) {
  if (
    !authenticatedProfile ||
    !authenticatedProfile.ativo
  ) {
    return false;
  }


  return allowedProfiles.includes(
    authenticatedProfile.perfil,
  );
}


export function isMasterAdministrator() {
  return hasProfile(
    USER_PROFILES.MASTER,
  );
}


export function isAdministrator() {
  return hasProfile(
    USER_PROFILES.MASTER,
    USER_PROFILES.ADMIN,
  );
}


/* =========================================================
   PERMISSÕES
========================================================= */

export function hasPermission(
  permission,
) {
  if (
    !authenticatedProfile ||
    !authenticatedProfile.ativo
  ) {
    return false;
  }


  /*
   * Gestão de usuários possui
   * proteção adicional.
   */
  if (
    permission ===
    PERMISSIONS.USERS_MANAGE
  ) {
    return Boolean(
      authenticatedProfile.perfil ===
        USER_PROFILES.MASTER &&
      authenticatedProfile
        .pode_gerenciar_usuarios ===
        true
    );
  }


  const permissions =
    PROFILE_PERMISSIONS[
      authenticatedProfile.perfil
    ];


  if (!permissions) {
    return false;
  }


  return permissions.has(
    permission,
  );
}


export function canManageUsers() {
  return hasPermission(
    PERMISSIONS.USERS_MANAGE,
  );
}


/* =========================================================
   PROTEÇÃO POR PERMISSÃO
========================================================= */

export function requirePermission(
  permission,
  {
    redirectTo =
      APP_PATH,
  } = {},
) {
  if (
    hasPermission(
      permission,
    )
  ) {
    return true;
  }


  console.warn(
    "[YXZ] Acesso negado por falta de permissão:",
    permission,
  );


  window.location.replace(
    redirectTo,
  );


  return false;
}


export function requireUserManagementPermission() {
  return requirePermission(
    PERMISSIONS.USERS_MANAGE,
  );
}


/* =========================================================
   ESTADO LOCAL
========================================================= */

function clearAuthState() {
  authenticatedUser =
    null;

  authenticatedProfile =
    null;
}


async function clearSupabaseSession() {
  clearAuthState();


  const {
    error,
  } =
    await supabase.auth.signOut({
      scope: "local",
    });


  if (error) {
    console.error(
      "[YXZ] Não foi possível limpar a sessão local:",
      error,
    );
  }
}


/* =========================================================
   PROTEÇÃO DE AUTENTICAÇÃO
========================================================= */

export async function requireAuth() {
  const user =
    await getAuthenticatedUser();


  if (!user) {
    clearAuthState();


    redirectToLogin({
      preserveNext: true,
      reason: "auth_required",
    });


    return null;
  }


  let profile;


  try {
    profile =
      await getUserProfile(
        user.id,
      );

  } catch (error) {

    console.error(
      "[YXZ] Não foi possível carregar o profile do usuário:",
      error,
    );


    await clearSupabaseSession();


    redirectToLogin({
      preserveNext: false,
      reason: "profile_error",
    });


    return null;
  }


  if (!profile) {
    console.error(
      "[YXZ] Usuário autenticado sem registro em profiles.",
      {
        userId:
          user.id,
      },
    );


    await clearSupabaseSession();


    redirectToLogin({
      preserveNext: false,
      reason: "profile_missing",
    });


    return null;
  }


  if (!profile.ativo) {
    console.warn(
      "[YXZ] Tentativa de acesso por usuário desativado.",
      {
        userId:
          user.id,

        perfil:
          profile.perfil,
      },
    );


    await clearSupabaseSession();


    redirectToLogin({
      preserveNext: false,
      reason: "inactive",
    });


    return null;
  }


  authenticatedUser =
    user;

  authenticatedProfile =
    profile;


  return user;
}


/* =========================================================
   LOGIN
========================================================= */

export async function signInWithPassword(
  email,
  password,
) {
  return supabase.auth
    .signInWithPassword({
      email,
      password,
    });
}


/* =========================================================
   LOGOUT
========================================================= */

export async function signOutCurrentSession() {
  clearAuthState();


  const {
    error,
  } =
    await supabase.auth.signOut({
      scope: "local",
    });


  if (error) {
    throw error;
  }


  window.location.replace(
    LOGIN_PATH,
  );
}


/* =========================================================
   LABELS
========================================================= */

function getProfileLabel(
  profile,
) {
  const labels = {
    administrador_master:
      "Administrador Master",

    administrador:
      "Administrador",

    educador_social:
      "Educador Social",

    coordenador:
      "Coordenador",

    instrutor:
      "Instrutor",
  };


  return (
    labels[
      profile?.perfil
    ] ||
    "Usuário"
  );
}


function getFallbackName(
  user,
) {
  const email =
    user?.email ||
    "";


  const metadataName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    "";


  if (
    metadataName.trim()
  ) {
    return metadataName.trim();
  }


  const emailName =
    email
      .split("@")[0]
      .replace(
        /[._-]+/g,
        " ",
      )
      .trim();


  return (
    emailName ||
    "Usuário"
  );
}


function getInitials(
  name,
) {
  const words =
    String(
      name || "",
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (!words.length) {
    return "YXZ";
  }


  if (
    words.length ===
    1
  ) {
    return words[0]
      .slice(
        0,
        2,
      )
      .toUpperCase();
  }


  return (
    words[0][0] +
    words[
      words.length - 1
    ][0]
  ).toUpperCase();
}


/* =========================================================
   ELEMENTOS RESTRITOS
========================================================= */

function renderUserManagementElements() {
  const allowed =
    canManageUsers();


  document
    .querySelectorAll(
      "[data-user-management-only]",
    )
    .forEach(
      (element) => {
        element.hidden =
          !allowed;
      },
    );
}


/* =========================================================
   ELEMENTOS POR PERMISSÃO
========================================================= */

function renderPermissionElements() {
  document
    .querySelectorAll(
      "[data-permission]",
    )
    .forEach(
      (element) => {
        const permission =
          element.dataset
            .permission;


        if (!permission) {
          return;
        }


        element.hidden =
          !hasPermission(
            permission,
          );
      },
    );
}


/* =========================================================
   APRESENTAÇÃO
========================================================= */

export function renderAuthenticatedUser(
  user,
) {
  if (!user) {
    return;
  }


  const profile =
    authenticatedProfile;


  const profileName =
    profile?.nome
      ?.trim();


  const name =
    profileName ||
    getFallbackName(
      user,
    );


  const email =
    profile?.email ||
    user.email ||
    "";


  const cargo =
    profile?.cargo
      ?.trim() ||
    "Colaborador";


  const profileLabel =
    getProfileLabel(
      profile,
    );


  const initials =
    getInitials(
      name,
    );


  document
    .querySelectorAll(
      "[data-auth-name]",
    )
    .forEach(
      (element) => {
        element.textContent =
          name;
      },
    );


  document
    .querySelectorAll(
      "[data-auth-email]",
    )
    .forEach(
      (element) => {
        element.textContent =
          email;
      },
    );


  document
    .querySelectorAll(
      "[data-auth-cargo]",
    )
    .forEach(
      (element) => {
        element.textContent =
          cargo;
      },
    );


  document
    .querySelectorAll(
      "[data-auth-profile]",
    )
    .forEach(
      (element) => {
        element.textContent =
          profileLabel;
      },
    );


  document
    .querySelectorAll(
      "[data-auth-avatar]",
    )
    .forEach(
      (element) => {
        element.textContent =
          initials;
      },
    );


  document.body.dataset.authProfile =
    profile?.perfil ||
    "";


  document.body.dataset.authActive =
    String(
      Boolean(
        profile?.ativo,
      ),
    );


  document.body.dataset
    .canManageUsers =
      String(
        canManageUsers(),
      );


  renderUserManagementElements();

  renderPermissionElements();
}


/* =========================================================
   LOGOUT
========================================================= */

export function initLogoutButtons() {
  const buttons =
    document.querySelectorAll(
      "[data-auth-logout]",
    );


  buttons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        async () => {
          if (
            button.disabled
          ) {
            return;
          }


          button.disabled =
            true;


          const originalText =
            button.textContent;


          button.textContent =
            "Saindo...";


          try {
            await signOutCurrentSession();

          } catch (error) {

            console.error(
              "[YXZ] Não foi possível encerrar a sessão:",
              error,
            );


            button.disabled =
              false;

            button.textContent =
              originalText;
          }
        },
      );
    },
  );
}


/* =========================================================
   MONITOR DE AUTH
========================================================= */

export function watchAuthState() {
  const {
    data,
  } =
    supabase.auth
      .onAuthStateChange(
        (event) => {
          if (
            event ===
            "SIGNED_OUT"
          ) {
            clearAuthState();


            window.location.replace(
              LOGIN_PATH,
            );
          }
        },
      );


  return () => {
    data.subscription
      .unsubscribe();
  };
}