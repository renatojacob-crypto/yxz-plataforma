import {
  getAuthenticatedUser,
  getSafeNextPath,
  signInWithPassword,
} from "./auth.js";


function setMessage(
  element,
  message = "",
  type = "",
) {
  if (!element) {
    return;
  }

  element.textContent =
    message;

  element.dataset.state =
    type;
}


function getAuthErrorMessage(
  error,
) {
  const code =
    error?.code || "";

  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha inválidos.";

    case "email_not_confirmed":
      return (
        "Este e-mail ainda não foi confirmado. " +
        "Confirme o usuário no Supabase antes de entrar."
      );

    case "user_banned":
      return (
        "Este usuário está temporariamente bloqueado."
      );

    case "over_request_rate_limit":
      return (
        "Muitas tentativas foram realizadas. " +
        "Aguarde alguns instantes e tente novamente."
      );

    case "email_provider_disabled":
      return (
        "O acesso por e-mail e senha não está disponível."
      );

    default:
      return (
        "Não foi possível validar o acesso. " +
        "Tente novamente."
      );
  }
}


export async function initLoginPage() {
  const form =
    document.getElementById(
      "loginForm",
    );

  if (!form) {
    return;
  }


  const emailInput =
    document.getElementById(
      "loginEmail",
    );

  const passwordInput =
    document.getElementById(
      "loginPassword",
    );

  const submitButton =
    form.querySelector(
      '[type="submit"]',
    );

  const status =
    form.querySelector(
      "[data-login-status]",
    );


  /*
   * Se já houver usuário autenticado,
   * segue diretamente para o portal.
   */
  const currentUser =
    await getAuthenticatedUser();

  if (currentUser) {
    window.location.replace(
      getSafeNextPath(),
    );

    return;
  }


  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();


      if (
        !emailInput ||
        !passwordInput
      ) {
        return;
      }


      const email =
        emailInput.value
          .trim()
          .toLowerCase();

      const password =
        passwordInput.value;


      if (!email) {
        setMessage(
          status,
          "Informe seu e-mail.",
          "error",
        );

        emailInput.focus();

        return;
      }


      if (!password) {
        setMessage(
          status,
          "Informe sua senha.",
          "error",
        );

        passwordInput.focus();

        return;
      }


      if (submitButton) {
        submitButton.disabled =
          true;

        submitButton.textContent =
          "Entrando...";
      }


      setMessage(
        status,
        "Validando acesso...",
        "loading",
      );


      try {
        const {
          data,
          error,
        } =
          await signInWithPassword(
            email,
            password,
          );


        if (error) {
          /*
           * Em desenvolvimento mostramos
           * o erro real no Console.
           *
           * Nunca mostramos a senha.
           */
          if (import.meta.env.DEV) {
            console.error(
              "[YXZ] Erro retornado pelo Supabase Auth:",
              {
                code:
                  error.code,

                status:
                  error.status,

                message:
                  error.message,
              },
            );
          }


          setMessage(
            status,
            getAuthErrorMessage(
              error,
            ),
            "error",
          );

          return;
        }


        if (!data?.user) {
          setMessage(
            status,
            "Não foi possível identificar o usuário autenticado.",
            "error",
          );

          return;
        }


        setMessage(
          status,
          "Acesso autorizado. Abrindo o portal...",
          "success",
        );


        window.location.replace(
          getSafeNextPath(),
        );
      } catch (error) {
        console.error(
          "[YXZ] Falha inesperada no login:",
          error,
        );


        setMessage(
          status,
          "Não foi possível conectar ao serviço de autenticação.",
          "error",
        );
      } finally {
        if (submitButton) {
          submitButton.disabled =
            false;

          submitButton.textContent =
            "Entrar";
        }
      }
    },
  );
}