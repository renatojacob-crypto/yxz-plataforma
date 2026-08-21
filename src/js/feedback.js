const TOAST_ICONS = {
  success: "✓",
  warning: "!",
  danger: "×",
  info: "i",
};

const VALID_TOAST_TYPES = [
  "success",
  "warning",
  "danger",
  "info",
];

const DEFAULT_TOAST_DURATION = 3500;
const TOAST_EXIT_DURATION = 250;

/**
 * Localiza ou cria o container global
 * responsável pelas notificações.
 */
function getToastContainer() {
  let container = document.querySelector(
    ".toast-container",
  );

  if (!container) {
    container = document.createElement("div");

    container.className = "toast-container";

    container.setAttribute(
      "aria-live",
      "polite",
    );

    container.setAttribute(
      "aria-relevant",
      "additions",
    );

    document.body.appendChild(container);
  }

  return container;
}

/**
 * Exibe uma notificação temporária.
 *
 * Tipos permitidos:
 * success | warning | danger | info
 */
export function showToast({
  type = "info",
  title = "Aviso",
  message = "",
  duration = DEFAULT_TOAST_DURATION,
} = {}) {
  const safeType = VALID_TOAST_TYPES.includes(type)
    ? type
    : "info";

  const safeDuration =
    Number.isFinite(Number(duration)) &&
    Number(duration) >= 0
      ? Number(duration)
      : DEFAULT_TOAST_DURATION;

  const container = getToastContainer();

  const toast = document.createElement("div");

  toast.className = `toast toast-${safeType}`;

  /*
   * Erros importantes são anunciados
   * imediatamente por leitores de tela.
   */
  toast.setAttribute(
    "role",
    safeType === "danger"
      ? "alert"
      : "status",
  );

  const icon = document.createElement("div");

  icon.className = "toast-icon";
  icon.textContent = TOAST_ICONS[safeType];

  /*
   * O ícone é apenas visual.
   */
  icon.setAttribute(
    "aria-hidden",
    "true",
  );

  const content = document.createElement("div");

  content.className = "toast-content";

  const titleElement =
    document.createElement("div");

  titleElement.className = "toast-title";
  titleElement.textContent =
    String(title || "Aviso");

  const messageElement =
    document.createElement("p");

  messageElement.className = "toast-message";
  messageElement.textContent =
    String(message || "");

  const closeButton =
    document.createElement("button");

  closeButton.type = "button";
  closeButton.className = "toast-close";

  /*
   * Como o caractere é fixo e criado por nós,
   * não há entrada externa via innerHTML.
   * Mesmo assim, textContent é mais simples.
   */
  closeButton.textContent = "×";

  closeButton.setAttribute(
    "aria-label",
    "Fechar notificação",
  );

  content.append(
    titleElement,
    messageElement,
  );

  toast.append(
    icon,
    content,
    closeButton,
  );

  container.appendChild(toast);

  /*
   * Aguarda o primeiro frame para permitir
   * a animação CSS de entrada.
   */
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  let removed = false;
  let autoCloseTimer = null;

  /**
   * Remove o toast com segurança.
   */
  function removeToast() {
    if (removed) {
      return;
    }

    removed = true;

    if (autoCloseTimer) {
      window.clearTimeout(
        autoCloseTimer,
      );
    }

    toast.classList.remove("show");

    window.setTimeout(() => {
      toast.remove();

      /*
       * Remove o container quando
       * não houver mais notificações.
       */
      if (
        container.childElementCount === 0
      ) {
        container.remove();
      }
    }, TOAST_EXIT_DURATION);
  }

  closeButton.addEventListener(
    "click",
    removeToast,
  );

  /*
   * duration === 0 mantém o toast
   * aberto até o usuário fechá-lo.
   */
  if (safeDuration > 0) {
    autoCloseTimer =
      window.setTimeout(
        removeToast,
        safeDuration,
      );
  }

  /*
   * Permite controle manual posteriormente:
   *
   * const toast = showToast(...);
   */
  return toast;
}

/**
 * Inicializa elementos HTML capazes
 * de disparar notificações por data-attributes.
 */
function initToastTriggers() {
  const triggers = document.querySelectorAll(
    "[data-toast-trigger]",
  );

  triggers.forEach((trigger) => {
    /*
     * Impede cadastrar o mesmo listener
     * mais de uma vez.
     */
    if (
      trigger.dataset.toastInitialized ===
      "true"
    ) {
      return;
    }

    trigger.dataset.toastInitialized =
      "true";

    trigger.addEventListener(
      "click",
      () => {
        showToast({
          type:
            trigger.dataset.toastType ||
            "info",

          title:
            trigger.dataset.toastTitle ||
            "Aviso",

          message:
            trigger.dataset.toastMessage ||
            "",

          duration:
            trigger.dataset.toastDuration ||
            DEFAULT_TOAST_DURATION,
        });
      },
    );
  });
}

/**
 * Inicializa os dialogs/modais da aplicação.
 */
function initModals() {
  const openButtons =
    document.querySelectorAll(
      "[data-modal-open]",
    );

  openButtons.forEach((button) => {
    /*
     * Evita listeners duplicados.
     */
    if (
      button.dataset.modalOpenInitialized ===
      "true"
    ) {
      return;
    }

    button.dataset.modalOpenInitialized =
      "true";

    button.addEventListener(
      "click",
      () => {
        const modalId =
          button.dataset.modalOpen;

        if (!modalId) {
          return;
        }

        const modal =
          document.getElementById(
            modalId,
          );

        if (
          modal instanceof
            HTMLDialogElement &&
          !modal.open
        ) {
          modal.showModal();
        }
      },
    );
  });

  const modals =
    document.querySelectorAll(
      "dialog[data-modal]",
    );

  modals.forEach((modal) => {
    /*
     * O próprio dialog também recebe
     * uma marca de inicialização.
     */
    if (
      modal.dataset.modalInitialized ===
      "true"
    ) {
      return;
    }

    modal.dataset.modalInitialized =
      "true";

    const closeButtons =
      modal.querySelectorAll(
        "[data-modal-close]",
      );

    closeButtons.forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          if (modal.open) {
            modal.close();
          }
        },
      );
    });

    /*
     * Clique diretamente no backdrop
     * fecha o modal.
     */
    modal.addEventListener(
      "click",
      (event) => {
        if (
          event.target === modal &&
          modal.open
        ) {
          modal.close();
        }
      },
    );
  });
}

/**
 * Inicializa todos os recursos
 * de feedback visual da aplicação.
 */
export function initFeedback() {
  initToastTriggers();
  initModals();
}