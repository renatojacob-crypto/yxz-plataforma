import {
  supabase,
} from "./supabase.js";


const APP_PATH =
  "/app/";


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
   ERRO PRESENTE NA URL
========================================================= */

function getUrlAuthError() {
  const hashParams =
    new URLSearchParams(
      window.location.hash
        .replace(
          /^#/,
          "",
        ),
    );


  const searchParams =
    new URLSearchParams(
      window.location.search,
    );


  const error =
    hashParams.get(
      "error",
    ) ||
    searchParams.get(
      "error",
    );


  const errorCode =
    hashParams.get(
      "error_code",
    ) ||
    searchParams.get(
      "error_code",
    );


  const description =
    hashParams.get(
      "error_description",
    ) ||
    searchParams.get(
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
    "O convite é inválido ou expirou."
  );
}


/* =========================================================
   USUÁRIO AUTENTICADO
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
   IDENTIFICAÇÃO DO CONVITE YXZ
========================================================= */

function isPendingInvite(
  user,
) {
  return (
    user
      ?.user_metadata
      ?.yxz_invite_pending ===
    true
  );
}


/* =========================================================
   ERRO DE SENHA
========================================================= */

function getPasswordErrorMessage(
  error,
) {
  const code =
    error?.code ||
    "";


  switch (code) {

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
        "Sua sessão de ativação expirou. " +
        "Solicite um novo convite."
      );


    default:
      return (
        "Não foi possível salvar a senha. " +
        "Verifique os requisitos e tente novamente."
      );
  }
}


/* =========================================================
   METADADOS APÓS A ATIVAÇÃO
========================================================= */

function getCompletedMetadata(
  user,
) {
  return {
    ...(
      user?.user_metadata ||
      {}
    ),

    yxz_invite_pending:
      false,

    yxz_account_activated:
      true,
  };
}


/* =========================================================
   REDIRECIONAMENTO
========================================================= */

function redirectToApp() {
  window.location.replace(
    APP_PATH,
  );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

export async function initDefinirSenhaPage() {
  const form =
    document.querySelector(
      "[data-password-form]",
    );


  const pageStatus =
    document.querySelector(
      "[data-password-page-status]",
    );


  const status =
    document.querySelector(
      "[data-password-status]",
    );


  const passwordInput =
    document.getElementById(
      "newPassword",
    );


  const confirmInput =
    document.getElementById(
      "confirmPassword",
    );


  const submitButton =
    document.querySelector(
      "[data-password-submit]",
    );


  if (
    !form ||
    !passwordInput ||
    !confirmInput
  ) {
    return;
  }


  /*
   * O formulário começa sempre
   * escondido.
   */
  form.hidden =
    true;


  setStatus(
    pageStatus,
    "Validando convite...",
    "loading",
  );


  /* =======================================================
     1. ERROS RECEBIDOS PELO LINK
  ======================================================= */

  const urlError =
    getUrlAuthError();


  if (urlError) {
    let message;


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
      pageStatus,
      message,
      "error",
    );


    return;
  }


  /* =======================================================
     2. VALIDA SESSÃO
  ======================================================= */

  let user;


  try {
    user =
      await getAuthenticatedUser();
  } catch (error) {
    console.error(
      "[YXZ] Não foi possível validar o usuário do convite:",
      error,
    );


    setStatus(
      pageStatus,
      (
        "Não foi possível validar este convite. " +
        "Tente abrir novamente o link recebido por e-mail."
      ),
      "error",
    );


    return;
  }


  if (!user) {
    setStatus(
      pageStatus,
      (
        "Este convite é inválido, expirou ou já foi utilizado. " +
        "Solicite um novo convite ao administrador."
      ),
      "error",
    );


    return;
  }


  /* =======================================================
     3. PROTEÇÃO PRINCIPAL
  ======================================================= */

  if (
    !isPendingInvite(
      user,
    )
  ) {
    console.warn(
      "[YXZ] Página de definição de senha aberta por uma sessão que não possui convite pendente.",
      {
        userId:
          user.id,
      },
    );


    setStatus(
      pageStatus,
      (
        "Esta página é exclusiva para a ativação de novos usuários. " +
        "A senha da sua sessão atual não será alterada."
      ),
      "error",
    );


    return;
  }


  /* =======================================================
     4. CONVITE VÁLIDO
  ======================================================= */

  setStatus(
    pageStatus,
    (
      user.email
        ? `Convite validado para ${user.email}.`
        : "Convite validado."
    ),
    "success",
  );


  form.hidden =
    false;


  passwordInput.focus();


  /* =======================================================
     5. SALVAR SENHA
  ======================================================= */

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();


      const password =
        passwordInput.value;


      const confirmation =
        confirmInput.value;


      if (
        password.length <
        8
      ) {
        setStatus(
          status,
          (
            "A senha deve possuir pelo menos " +
            "8 caracteres."
          ),
          "error",
        );


        passwordInput.focus();


        return;
      }


      if (
        password !==
        confirmation
      ) {
        setStatus(
          status,
          "As duas senhas precisam ser iguais.",
          "error",
        );


        confirmInput.focus();


        return;
      }


      if (submitButton) {
        submitButton.disabled =
          true;


        submitButton.textContent =
          "Salvando...";
      }


      setStatus(
        status,
        "Salvando sua senha...",
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

              data:
                getCompletedMetadata(
                  user,
                ),
            });


        if (error) {
          setStatus(
            status,
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
            status,
            (
              "A senha foi processada, mas não foi possível " +
              "confirmar a ativação da conta."
            ),
            "error",
          );


          return;
        }


        user =
          data.user;


        passwordInput.value =
          "";

        confirmInput.value =
          "";


        form.hidden =
          true;


        setStatus(
          pageStatus,
          (
            "Conta ativada com sucesso. " +
            "Abrindo o Portal YXZ..."
          ),
          "success",
        );


        setStatus(
          status,
          "",
        );


        window.setTimeout(
          redirectToApp,
          700,
        );

      } catch (error) {
        console.error(
          "[YXZ] Falha ao definir senha:",
          error,
        );


        setStatus(
          status,
          (
            "Não foi possível concluir " +
            "a ativação agora."
          ),
          "error",
        );

      } finally {
        if (submitButton) {
          submitButton.disabled =
            false;


          submitButton.textContent =
            "Salvar senha";
        }
      }
    },
  );
}