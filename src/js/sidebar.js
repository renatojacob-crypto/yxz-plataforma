/* =========================================================
   YXZ PLATAFORMA
   SIDEBAR CENTRALIZADA
========================================================= */


const MENU_SECTIONS = [
  {
    title: "Visão geral",

    items: [
      {
        page: "dashboard",
        label: "Dashboard",
        href: "/app/",
        icon: "▦",
        permission: "dashboard.visualizar",
      },
    ],
  },


  {
    title: "Eventos",

    items: [
      {
        page: "agendamentos",
        label: "Agendamentos",
        href: "/app/agendamentos.html",
        icon: "＋",
        permission: "oficinas.visualizar",
      },

      {
        page: "escalas",
        label: "Escalas",
        href: "/app/escalas.html",
        icon: "♙",
        permission: "escalas.visualizar",
      },

      {
        page: "execucoes",
        label: "Execuções",
        href: "/app/execucoes.html",
        icon: "✓",
        permission: "oficinas.registrar_execucao",
      },

      {
        page: "calendario",
        label: "Calendário",
        href: "#",
        icon: "□",
        permission: "oficinas.visualizar",
      },
    ],
  },


  {
    title: "Equipe",

    items: [
      {
        page: "instrutores",
        label: "Instrutores",
        href: "/app/instrutores.html",
        icon: "◎",
        permission: "escalas.gerenciar",
      },

      {
        page: "horas",
        label: "Horas",
        href: "/app/horas.html",
        icon: "◷",
        permission: "escalas.visualizar",
      },

      {
        page: "conferencia",
        label: "Conferência",
        href: "/app/conferencia.html",
        icon: "≋",
        permission: "oficinas.registrar_execucao",
      },
    ],
  },


  {
    title: "Financeiro",

    items: [
      {
        page: "previsoes",
        label: "Previsões",
        href: "#",
        icon: "◇",
        permission: "previsoes.visualizar",
      },

      {
        page: "gastos",
        label: "Gastos",
        href: "#",
        icon: "$",
        permission: "gastos.visualizar",
      },

      {
        page: "comparativo",
        label: "Comparativo",
        href: "#",
        icon: "↗",
        permission: "gastos.visualizar",
      },
    ],
  },


  {
    title: "Gestão",

    items: [
      {
        page: "relatorios",
        label: "Relatórios",
        href: "#",
        icon: "▤",
        permission: "relatorios.visualizar",
      },

      {
        page: "usuarios",
        label: "Usuários",
        href: "/app/usuarios.html",
        icon: "♟",
        permission: "usuarios.gerenciar",
      },
    ],
  },
];


/* =========================================================
   BRAND
========================================================= */

function createBrand() {
  const brand =
    document.createElement(
      "div",
    );


  brand.className =
    "sidebar-brand";


  const symbol =
    document.createElement(
      "div",
    );


  symbol.className =
    "brand-symbol";


  symbol.setAttribute(
    "aria-hidden",
    "true",
  );


  symbol.textContent =
    "YXZ";


  const text =
    document.createElement(
      "div",
    );


  text.className =
    "brand-text";


  const title =
    document.createElement(
      "strong",
    );


  title.textContent =
    "Plataforma YXZ";


  const subtitle =
    document.createElement(
      "span",
    );


  subtitle.textContent =
    "Gestão Educacional";


  text.append(
    title,
    subtitle,
  );


  brand.append(
    symbol,
    text,
  );


  return brand;
}


/* =========================================================
   LINK
========================================================= */

function createMenuLink(
  item,
  currentPage,
) {
  const link =
    document.createElement(
      "a",
    );


  link.href =
    item.href;


  link.className =
    "nav-link";


  link.dataset.permission =
    item.permission;


  link.hidden =
    true;


  if (
    item.page ===
    currentPage
  ) {
    link.classList.add(
      "active",
    );


    link.setAttribute(
      "aria-current",
      "page",
    );
  }


  const icon =
    document.createElement(
      "span",
    );


  icon.className =
    "nav-icon";


  icon.setAttribute(
    "aria-hidden",
    "true",
  );


  icon.textContent =
    item.icon;


  const label =
    document.createElement(
      "span",
    );


  label.textContent =
    item.label;


  link.append(
    icon,
    label,
  );


  return link;
}


/* =========================================================
   SEÇÃO
========================================================= */

function createMenuSection(
  section,
  currentPage,
) {
  const wrapper =
    document.createElement(
      "div",
    );


  wrapper.className =
    "nav-section";


  const title =
    document.createElement(
      "p",
    );


  title.className =
    "nav-section-title";


  title.textContent =
    section.title;


  wrapper.append(
    title,
  );


  section.items.forEach(
    (item) => {

      wrapper.append(
        createMenuLink(
          item,
          currentPage,
        ),
      );
    },
  );


  return wrapper;
}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function createNavigation(
  currentPage,
) {
  const navigation =
    document.createElement(
      "nav",
    );


  navigation.className =
    "sidebar-nav";


  navigation.setAttribute(
    "aria-label",
    "Navegação principal",
  );


  MENU_SECTIONS.forEach(
    (section) => {

      navigation.append(
        createMenuSection(
          section,
          currentPage,
        ),
      );
    },
  );


  return navigation;
}


/* =========================================================
   RENDER
========================================================= */

export function renderSidebar() {
  const sidebar =
    document.getElementById(
      "sidebar",
    );


  if (
    !sidebar
  ) {
    console.warn(
      "[YXZ] Sidebar não encontrada na página.",
    );


    return;
  }


  const currentPage =
    document.body.dataset
      .appPage ||
    "dashboard";


  sidebar.replaceChildren();


  sidebar.append(
    createBrand(),

    createNavigation(
      currentPage,
    ),
  );
}