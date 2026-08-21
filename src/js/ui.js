/**
 * Inicializa o comportamento da sidebar/menu lateral.
 */
export function initSidebar() {
  const body = document.body;

  const toggleButton = document.querySelector(
    "[data-sidebar-toggle]",
  );

  const closeElements = document.querySelectorAll(
    "[data-sidebar-close]",
  );

  /**
   * Atualiza o estado visual e de acessibilidade
   * do botão responsável pela sidebar.
   */
  function updateSidebarState(isOpen) {
    toggleButton?.setAttribute(
      "aria-expanded",
      String(isOpen),
    );
  }

  /**
   * Abre a sidebar.
   */
  function openSidebar() {
    body.classList.add("sidebar-open");
    updateSidebarState(true);
  }

  /**
   * Fecha a sidebar.
   */
  function closeSidebar() {
    body.classList.remove("sidebar-open");
    updateSidebarState(false);
  }

  /**
   * Alterna entre sidebar aberta e fechada.
   */
  function toggleSidebar() {
    const isOpen = body.classList.contains(
      "sidebar-open",
    );

    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  /**
   * Evento do botão principal da sidebar.
   */
  toggleButton?.addEventListener(
    "click",
    toggleSidebar,
  );

  /**
   * Elementos que fecham a sidebar:
   * backdrop, botão de fechar, links etc.
   */
  closeElements.forEach((element) => {
    element.addEventListener(
      "click",
      closeSidebar,
    );
  });

  /**
   * Ao voltar para o layout desktop,
   * garante que o estado mobile seja encerrado.
   */
  window.addEventListener("resize", () => {
    if (window.innerWidth > 850) {
      closeSidebar();
    }
  });

  /**
   * Permite fechar a sidebar pressionando ESC.
   */
  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        body.classList.contains("sidebar-open")
      ) {
        closeSidebar();

        toggleButton?.focus();
      }
    },
  );

  /**
   * Estado inicial de acessibilidade.
   */
  updateSidebarState(
    body.classList.contains("sidebar-open"),
  );
}