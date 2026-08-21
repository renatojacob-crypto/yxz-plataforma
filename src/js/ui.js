export function initSidebar() {
  const body = document.body;

  const toggleButton = document.querySelector(
    "[data-sidebar-toggle]",
  );

  const closeElements = document.querySelectorAll(
    "[data-sidebar-close]",
  );

  function openSidebar() {
    body.classList.add("sidebar-open");
  }

  function closeSidebar() {
    body.classList.remove("sidebar-open");
  }

  function toggleSidebar() {
    body.classList.toggle("sidebar-open");
  }

  toggleButton?.addEventListener(
    "click",
    toggleSidebar,
  );

  closeElements.forEach((element) => {
    element.addEventListener(
      "click",
      closeSidebar,
    );
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 850) {
      closeSidebar();
    }
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    },
  );
}