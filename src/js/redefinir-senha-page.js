import {
  supabase,
} from "./supabase.js";


import {
  appUrl,
} from "./paths.js";


const APP_PATH =
  appUrl();


let recoveryAuthorized =
  false;


/* =========================================================
   STATUS
========================================================= */

function setStatus(
  element,
  message = "",
  state = "",
) {
  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.dataset.state =
    state;
}


/* =========================================================
   PARÂMETROS DA URL
========================================================= */

function getUrlParameters() {
  const search =
    new URLSearchParams(
      window.location.search,
    );


  const hash =
    new URLSearchParams(
      window.location.hash
        .replace(
          /^#/,
          "",
        ),
    );


  return {
    search,
    hash,
  };
}


function hasRecoveryMarker() {
  const {
    search,
    hash,
  } =
    getUrlParameters();


  const type =
    hash.get("type") ||
    search.get("type");


  return (
    type ===
    "recovery"
  );
}


function getUrlError() {
  const {
    search,
    hash,
  } =
    getUrlParameters();


  const error =
    hash.get("error") ||
    search.get("error");


  const errorCode =
    hash.get(
      "error_code",
    ) ||
    search.get(
      "error_code",
    );


  const description =
    hash.get(
      "error_description",
    ) ||
    search.get(
      "error_description",
    );


  if (
    !error &&
    !errorCode &&
    !description
  ) {
    return null;
  }


  return (
    description ||
    "O link de recuperação é inválido ou expirou."
  );
}


/* =========================================================
   USUÁRIO
========================================================= */

async function getAuthenticatedUser() {
  const {
    data,
    error,
  } =
    await supabase.auth
      .getUser();


  if (
    error ||
    !data?.user
  ) {
    return null;
  }


  return data.user;
}


/* =========================================================
   ERROS
========================================================= */

function getPasswordErrorMessage(
  error,
) {
  switch (
    error?.code
  ) {

    case "same_password":
      return (
        "Escolha uma senha diferente da senha atual."
      );


    case "weak_password":
      return (
        "A senha não atende aos requisitos de segurança."
      );


    case "session_not_found":
      return (
        "A sessão de recuperação expirou. " +
        "Solicite uma nova redefinição."
      );


    default:
      return (
        "Não foi possível alterar a senha. " +
        "Tente novamente."
      );
  }
}


/* =========================================================
   LIBERAR FORMULÁRIO
========================================================= */

function authorizeRecovery(
  user,
  elements,
) {
  if (
    recoveryAuthorized
  ) {
    return;
  }


  recoveryAuthorized =
    true;


  setStatus(
    elements.pageStatus,
    (
      user?.email
        ? (
          "Recuperação validada para " +
          user.email +
          "."
        )
        : (
          "Recuperação validada."
        )
    ),
    "success",
  );


  elements.form.hidden =
    false;


  requestAnimationFrame(
    () => {
      elements.password
        ?.focus();
    },
  );
}


/* =========================================================
   SALVAR NOVA SENHA
========================================================= */

async function saveNewPassword(
  elements,
) {
  /*
   * A verificação é repetida imediatamente
   * antes de updateUser().
   */
  if (
    !recoveryAuthorized
  ) {
    setStatus(
      elements.status,
      (
        "Esta página não possui uma sessão " +
        "válida de recuperação."
      ),
      "error",
    );


    return;
  }


  const password =
    elements.password
      .value;


  const confirmation =
    elements.confirmation
      .value;


  if (
    password.length <
    8
  ) {
    setStatus(
      elements.status,
      (
        "A senha deve possuir pelo menos " +
        "8 caracteres."
      ),
      "error",
    );


    elements.password
      .focus();


    return;
  }


  if (
    password !==
    confirmation
  ) {
    setStatus(
      elements.status,
      "As duas senhas precisam ser iguais.",
      "error",
    );


    elements.confirmation
      .focus();


    return;
  }


  if (
    elements.submit
  ) {
    elements.submit.disabled =
      true;


    elements.submit.textContent =
      "Salvando...";
  }


  setStatus(
    elements.status,
    "Salvando nova senha...",
    "loading",
  );


  try {
    const {
      data,
      error,
    } =
      await supabase.auth
        .updateUser({
          password,
        });


    if (error) {
      setStatus(
        elements.status,
        getPasswordErrorMessage(
          error,
        ),
        "error",
      );


      return;
    }


    if (
      !data?.user
    ) {
      setStatus(
        elements.status,
        (
          "Não foi possível confirmar " +
          "a alteração da senha."
        ),
        "error",
      );


      return;
    }


    recoveryAuthorized =
      false;


    elements.password.value =
      "";

    elements.confirmation.value =
      "";

    elements.form.hidden =
      true;


    setStatus(
      elements.pageStatus,
      (
        "Senha alterada com sucesso. " +
        "Abrindo o Portal YXZ..."
      ),
      "success",
    );


    setStatus(
      elements.status,
      "",
    );


    window.setTimeout(
      () => {
        window.location.replace(
          APP_PATH,
        );
      },
      700,
    );

  } catch (error) {
    console.error(
      "[YXZ] Falha ao redefinir senha:",
      error,
    );


    setStatus(
      elements.status,
      (
        "Não foi possível concluir " +
        "a redefinição agora."
      ),
      "error",
    );

  } finally {
    if (
      elements.submit
    ) {
      elements.submit.disabled =
        false;


      elements.submit.textContent =
        "Salvar nova senha";
    }
  }
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

export async function initRedefinirSenhaPage() {
  const elements = {
    form:
      document.querySelector(
        "[data-recovery-form]",
      ),

    pageStatus:
      document.querySelector(
        "[data-recovery-page-status]",
      ),

    status:
      document.querySelector(
        "[data-recovery-status]",
      ),

    password:
      document.getElementById(
        "recoveryPassword",
      ),

    confirmation:
      document.getElementById(
        "recoveryPasswordConfirm",
      ),

    submit:
      document.querySelector(
        "[data-recovery-submit]",
      ),
  };


  if (
    !elements.form ||
    !elements.password ||
    !elements.confirmation
  ) {
    return;
  }


  elements.form.hidden =
    true;


  setStatus(
    elements.pageStatus,
    "Validando solicitação...",
    "loading",
  );


  /* =======================================================
     ERRO RECEBIDO DO AUTH
  ======================================================= */

  const urlError =
    getUrlError();


  if (urlError) {
    let message =
      urlError;


    try {
      message =
        decodeURIComponent(
          urlError,
        );
    } catch {
      message =
        urlError;
    }


    setStatus(
      elements.pageStatus,
      message,
      "error",
    );


    return;
  }


  /* =======================================================
     MONITOR DE PASSWORD_RECOVERY
  ======================================================= */

  const {
    data:
      authListener,
  } =
    supabase.auth
      .onAuthStateChange(
        (
          event,
          session,
        ) => {
          if (
            event ===
              "PASSWORD_RECOVERY" &&
            session?.user
          ) {
            authorizeRecovery(
              session.user,
              elements,
            );
          }
        },
      );


  /*
   * No fluxo implicit, a URL também
   * recebe type=recovery.
   *
   * Isso serve como fallback caso o
   * evento já tenha ocorrido antes da
   * inicialização visual da página.
   */
  if (
    hasRecoveryMarker()
  ) {
    const user =
      await getAuthenticatedUser();


    if (user) {
      authorizeRecovery(
        user,
        elements,
      );
    }
  }


  /*
   * Sem PASSWORD_RECOVERY ou marcador
   * de recuperação, uma sessão comum
   * não recebe acesso ao formulário.
   */
  window.setTimeout(
    () => {
      if (
        !recoveryAuthorized
      ) {
        setStatus(
          elements.pageStatus,
          (
            "Este link de recuperação é inválido, " +
            "expirou ou já foi utilizado."
          ),
          "error",
        );
      }
    },
    1200,
  );


  elements.form
    .addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();


        await saveNewPassword(
          elements,
        );
      },
    );


  window.addEventListener(
    "pagehide",
    () => {
      authListener
        .subscription
        .unsubscribe();
    },
    {
      once:
        true,
    },
  );
}