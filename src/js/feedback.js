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
      "aria-atomic",
      "true",
    );

    document.body.appendChild(container);
  }

  return container;
}

export function showToast({
  type = "info",
  title = "Aviso",
  message = "",
  duration = 3500,
} = {}) {
  const safeType = VALID_TOAST_TYPES.includes(type)
    ? type
    : "info";

  const container = getToastContainer();

  const toast = document.createElement("div");

  toast.className = `toast toast-${safeType}`;

  toast.setAttribute("role", "status");

  const icon = document.createElement("div");

  icon.className = "toast-icon";
  icon.textContent = TOAST_ICONS[safeType];

  const content = document.createElement("div");

  content.className = "toast-content";

  const titleElement =
    document.createElement("div");

  titleElement.className = "toast-title";
  titleElement.textContent = title;

  const messageElement =
    document.createElement("p");

  messageElement.className = "toast-message";
  messageElement.textContent = message;

  const closeButton =
    document.createElement("button");

  closeButton.type = "button";
  closeButton.className = "toast-close";
  closeButton.innerHTML = "&times;";

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

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  let removed = false;

  function removeToast() {
    if (removed) {
      return;
    }

    removed = true;

    toast.classList.remove("show");

    window.setTimeout(() => {
      toast.remove();
    }, 250);
  }

  closeButton.addEventListener(
    "click",
    removeToast,
  );

  window.setTimeout(
    removeToast,
    duration,
  );
}

function initToastTriggers() {
  const triggers = document.querySelectorAll(
    "[data-toast-trigger]",
  );

  triggers.forEach((trigger) => {
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
        });
      },
    );
  });
}

function initModals() {
  const openButtons =
    document.querySelectorAll(
      "[data-modal-open]",
    );

  openButtons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const modalId =
          button.dataset.modalOpen;

        const modal =
          document.getElementById(
            modalId,
          );

        if (
          modal instanceof HTMLDialogElement
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
    const closeButtons =
      modal.querySelectorAll(
        "[data-modal-close]",
      );

    closeButtons.forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          modal.close();
        },
      );
    });

    modal.addEventListener(
      "click",
      (event) => {
        if (event.target === modal) {
          modal.close();
        }
      },
    );
  });
}

export function initFeedback() {
  initToastTriggers();
  initModals();
}