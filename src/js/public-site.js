const REDUCED_MOTION_QUERY =
  "(prefers-reduced-motion: reduce)";

const numberFormatter =
  new Intl.NumberFormat("pt-BR");


function initHeaderScroll() {
  const header =
    document.querySelector(
      "[data-header]",
    );

  if (!header) {
    return;
  }

  function updateHeader() {
    header.classList.toggle(
      "is-scrolled",
      window.scrollY > 16,
    );
  }

  updateHeader();

  window.addEventListener(
    "scroll",
    updateHeader,
    {
      passive: true,
    },
  );
}


function initNavigation() {
  const body = document.body;

  const nav =
    document.querySelector(
      "[data-nav]",
    );

  const toggleButton =
    document.querySelector(
      "[data-nav-toggle]",
    );

  if (!nav || !toggleButton) {
    return;
  }

  const mobileQuery =
    window.matchMedia(
      "(max-width: 820px)",
    );

  function updateMenuState(isOpen) {
    const isMobile =
      mobileQuery.matches;

    const shouldOpen =
      isMobile && isOpen;

    body.classList.toggle(
      "nav-open",
      shouldOpen,
    );

    toggleButton.setAttribute(
      "aria-expanded",
      String(shouldOpen),
    );

    toggleButton.setAttribute(
      "aria-label",
      shouldOpen
        ? "Fechar menu"
        : "Abrir menu",
    );

    nav.inert =
      isMobile && !shouldOpen;
  }

  function closeMenu({
    restoreFocus = false,
  } = {}) {
    updateMenuState(false);

    if (restoreFocus) {
      requestAnimationFrame(() => {
        toggleButton.focus({
          preventScroll: true,
        });
      });
    }
  }

  function toggleMenu() {
    const isOpen =
      body.classList.contains(
        "nav-open",
      );

    updateMenuState(!isOpen);
  }

  toggleButton.addEventListener(
    "click",
    toggleMenu,
  );

  nav
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener(
        "click",
        () => {
          const hadKeyboardFocus =
            nav.contains(
              document.activeElement,
            );

          closeMenu({
            restoreFocus:
              mobileQuery.matches &&
              hadKeyboardFocus,
          });
        },
      );
    });

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        body.classList.contains(
          "nav-open",
        )
      ) {
        closeMenu({
          restoreFocus: true,
        });
      }
    },
  );

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (
        !body.classList.contains(
          "nav-open",
        )
      ) {
        return;
      }

      const target =
        event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        nav.contains(target) ||
        toggleButton.contains(target)
      ) {
        return;
      }

      closeMenu();
    },
  );

  function handleBreakpointChange() {
    closeMenu();

    if (!mobileQuery.matches) {
      nav.inert = false;
    }
  }

  if (
    typeof mobileQuery.addEventListener ===
    "function"
  ) {
    mobileQuery.addEventListener(
      "change",
      handleBreakpointChange,
    );
  } else {
    mobileQuery.addListener(
      handleBreakpointChange,
    );
  }

  updateMenuState(false);
}


function showAllRevealItems() {
  document
    .querySelectorAll(".reveal")
    .forEach((item) => {
      item.classList.add(
        "is-visible",
      );
    });
}


function initRevealAnimations() {
  const items =
    document.querySelectorAll(
      ".reveal",
    );

  if (!items.length) {
    return;
  }

  const reduceMotion =
    window.matchMedia(
      REDUCED_MOTION_QUERY,
    ).matches;

  if (
    reduceMotion ||
    !("IntersectionObserver" in window)
  ) {
    showAllRevealItems();
    return;
  }

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "is-visible",
            );

            observer.unobserve(
              entry.target,
            );
          },
        );
      },
      {
        threshold: 0.12,
        rootMargin:
          "0px 0px -40px 0px",
      },
    );

  items.forEach((item) => {
    observer.observe(item);
  });
}


function initCounters() {
  const counters =
    document.querySelectorAll(
      "[data-count]",
    );

  if (!counters.length) {
    return;
  }

  function getTarget(element) {
    const target =
      Number(
        element.dataset.count ||
        0,
      );

    return Number.isFinite(target)
      ? target
      : 0;
  }

  function formatCounter(
    element,
    value,
  ) {
    const prefix =
      element.dataset.countPrefix ||
      "";

    const suffix =
      element.dataset.countSuffix ||
      "";

    const formatted =
      numberFormatter.format(
        Math.floor(value),
      );

    return `${prefix}${formatted}${suffix}`;
  }

  function setFinalValue(element) {
    const target =
      getTarget(element);

    element.textContent =
      formatCounter(
        element,
        target,
      );
  }

  const reduceMotion =
    window.matchMedia(
      REDUCED_MOTION_QUERY,
    ).matches;

  if (
    reduceMotion ||
    !("IntersectionObserver" in window)
  ) {
    counters.forEach(
      setFinalValue,
    );

    return;
  }

  counters.forEach((counter) => {
    counter.textContent =
      formatCounter(
        counter,
        0,
      );
  });

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const element =
              entry.target;

            const target =
              getTarget(element);

            const duration = 1400;
            const start =
              performance.now();

            function tick(now) {
              const progress =
                Math.min(
                  (now - start) /
                    duration,
                  1,
                );

              const eased =
                1 -
                Math.pow(
                  1 - progress,
                  3,
                );

              element.textContent =
                formatCounter(
                  element,
                  target * eased,
                );

              if (progress < 1) {
                requestAnimationFrame(
                  tick,
                );
              } else {
                setFinalValue(
                  element,
                );
              }
            }

            requestAnimationFrame(
              tick,
            );

            observer.unobserve(
              element,
            );
          },
        );
      },
      {
        threshold: 0.65,
      },
    );

  counters.forEach(
    (counter) => {
      observer.observe(counter);
    },
  );
}


function initPortfolioFilters() {
  const buttons =
    document.querySelectorAll(
      "[data-filter]",
    );

  const cards =
    document.querySelectorAll(
      "[data-category]",
    );

  if (
    !buttons.length ||
    !cards.length
  ) {
    return;
  }

  function applyFilter(
    selectedButton,
  ) {
    const filter =
      selectedButton.dataset.filter ||
      "all";

    buttons.forEach(
      (button) => {
        const active =
          button ===
          selectedButton;

        button.classList.toggle(
          "active",
          active,
        );

        button.setAttribute(
          "aria-pressed",
          String(active),
        );
      },
    );

    cards.forEach(
      (card) => {
        const categories =
          (
            card.dataset.category ||
            ""
          )
            .split(/\s+/)
            .filter(Boolean);

        const shouldShow =
          filter === "all" ||
          categories.includes(
            filter,
          );

        card.hidden =
          !shouldShow;

        if (shouldShow) {
          card.classList.add(
            "is-visible",
          );
        }
      },
    );
  }

  buttons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          applyFilter(button);
        },
      );
    },
  );

  const initialButton =
    Array.from(buttons).find(
      (button) =>
        button.getAttribute(
          "aria-pressed",
        ) === "true",
    ) ||
    buttons[0];

  if (initialButton) {
    applyFilter(initialButton);
  }
}


function initProposalForm() {
  const form =
    document.getElementById(
      "proposalForm",
    );

  if (!form) {
    return;
  }

  const status =
    form.querySelector(
      "[data-form-status]",
    );

  const submitButton =
    form.querySelector(
      '[type="submit"]',
    );

  const defaultButtonText =
    submitButton?.textContent
      ?.trim() ||
    "Enviar solicitação";

  function resetFormState() {
    form.dataset.submitting =
      "false";

    if (submitButton) {
      submitButton.disabled =
        false;

      submitButton.textContent =
        defaultButtonText;
    }

    if (status) {
      status.textContent = "";
    }
  }

  form.addEventListener(
    "submit",
    (event) => {
      if (
        form.dataset.submitting ===
        "true"
      ) {
        event.preventDefault();
        return;
      }

      form.dataset.submitting =
        "true";

      if (submitButton) {
        submitButton.disabled =
          true;

        submitButton.textContent =
          "Enviando...";
      }

      if (status) {
        status.textContent =
          "Enviando sua solicitação...";
      }
    },
  );

  window.addEventListener(
    "pageshow",
    resetFormState,
  );

  resetFormState();
}


function initializeModule(
  name,
  callback,
  fallback = null,
) {
  try {
    callback();
  } catch (error) {
    console.error(
      `[YXZ] Erro ao inicializar "${name}":`,
      error,
    );

    if (fallback) {
      try {
        fallback();
      } catch (fallbackError) {
        console.error(
          `[YXZ] Erro no fallback de "${name}":`,
          fallbackError,
        );
      }
    }
  }
}


export function initPublicSite() {
  initializeModule(
    "Cabeçalho",
    initHeaderScroll,
  );

  initializeModule(
    "Navegação",
    initNavigation,
  );

  initializeModule(
    "Animações de entrada",
    initRevealAnimations,
    showAllRevealItems,
  );

  initializeModule(
    "Contadores",
    initCounters,
  );

  initializeModule(
    "Filtros do portfólio",
    initPortfolioFilters,
  );

  initializeModule(
    "Formulário de proposta",
    initProposalForm,
  );
}