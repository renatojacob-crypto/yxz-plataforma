import {
  supabase,
} from "./supabase.js";


const LOGIN_PATH =
  "/app/login.html";

const APP_PATH =
  "/app/";


function getCurrentInternalPath() {
  return (
    window.location.pathname +
    window.location.search +
    window.location.hash
  );
}


function buildLoginUrl() {
  const next =
    encodeURIComponent(
      getCurrentInternalPath(),
    );

  return `${LOGIN_PATH}?next=${next}`;
}


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

  /*
   * Evita redirecionamento para
   * sites externos.
   */
  if (
    !next.startsWith("/app/") ||
    next.startsWith("//")
  ) {
    return APP_PATH;
  }

  /*
   * Evita loop de login.
   */
  if (
    next.startsWith(
      "/app/login.html",
    )
  ) {
    return APP_PATH;
  }

  return next;
}


export async function getAuthenticatedUser() {
  const {
    data,
    error,
  } =
    await supabase.auth.getUser();

  if (error || !data?.user) {
    return null;
  }

  return data.user;
}


export async function requireAuth() {
  const user =
    await getAuthenticatedUser();

  if (!user) {
    window.location.replace(
      buildLoginUrl(),
    );

    return null;
  }

  return user;
}


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


export async function signOutCurrentSession() {
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


export function renderAuthenticatedUser(
  user,
) {
  if (!user) {
    return;
  }

  const email =
    user.email || "";

  const metadataName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    "";

  const fallbackName =
    email
      .split("@")[0]
      .replace(/[._-]+/g, " ");

  const name =
    metadataName ||
    fallbackName ||
    "Usuário";


  document
    .querySelectorAll(
      "[data-auth-email]",
    )
    .forEach((element) => {
      element.textContent =
        email;
    });


  document
    .querySelectorAll(
      "[data-auth-name]",
    )
    .forEach((element) => {
      element.textContent =
        name;
    });
}


export function initLogoutButtons() {
  const buttons =
    document.querySelectorAll(
      "[data-auth-logout]",
    );

  buttons.forEach((button) => {
    button.addEventListener(
      "click",
      async () => {
        if (button.disabled) {
          return;
        }

        button.disabled = true;

        try {
          await signOutCurrentSession();
        } catch (error) {
          console.error(
            "[YXZ] Não foi possível encerrar a sessão:",
            error,
          );

          button.disabled = false;
        }
      },
    );
  });
}


export function watchAuthState() {
  const {
    data,
  } =
    supabase.auth
      .onAuthStateChange(
        (event) => {
          if (
            event === "SIGNED_OUT"
          ) {
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