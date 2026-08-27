import {
  supabase,
} from "./supabase.js";

import {
  hasPermission,
  PERMISSIONS,
} from "./auth.js";


const EVENT_TYPES = {
  EDUCATIONAL_WORKSHOP:
    "oficina_educacional",

  COMMUNITY_EVENT:
    "evento_comunidade",
};


let regionals = [];
let schools = [];
let catalogItems = [];
let workshops = [];

let selectedWorkshopId = null;
let selectedSchoolId = null;
let cancelWorkshopId = null;


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-workshops-message]",
      ),

    total:
      document.querySelector(
        "[data-workshops-total]",
      ),

    scheduled:
      document.querySelector(
        "[data-workshops-scheduled]",
      ),

    cancelled:
      document.querySelector(
        "[data-workshops-cancelled]",
      ),

    search:
      document.querySelector(
        "[data-workshops-search]",
      ),

    regionalFilter:
      document.querySelector(
        "[data-workshops-regional-filter]",
      ),

    schoolFilter:
      document.querySelector(
        "[data-workshops-school-filter]",
      ),

    typeFilter:
      document.querySelector(
        "[data-workshops-type-filter]",
      ),

    statusFilter:
      document.querySelector(
        "[data-workshops-status-filter]",
      ),

    dateStart:
      document.querySelector(
        "[data-workshops-date-start]",
      ),

    dateEnd:
      document.querySelector(
        "[data-workshops-date-end]",
      ),

    tableBody:
      document.querySelector(
        "[data-workshops-table-body]",
      ),

    empty:
      document.querySelector(
        "[data-workshops-empty]",
      ),

    newButton:
      document.querySelector(
        "[data-new-workshop]",
      ),


    /* EVENTO */

    workshopDialog:
      document.getElementById(
        "workshopDialog",
      ),

    workshopForm:
      document.getElementById(
        "workshopForm",
      ),

    workshopKicker:
      document.querySelector(
        "[data-workshop-dialog-kicker]",
      ),

    workshopTitle:
      document.querySelector(
        "[data-workshop-dialog-title]",
      ),

    workshopRegional:
      document.querySelector(
        "[data-workshop-regional]",
      ),

    workshopSchoolSearch:
      document.querySelector(
        "[data-workshop-school-search]",
      ),

    workshopSchoolResults:
      document.querySelector(
        "[data-workshop-school-results]",
      ),

    schoolCombobox:
      document.querySelector(
        "[data-school-combobox]",
      ),

    newSchoolButton:
      document.querySelector(
        "[data-new-school]",
      ),

    workshopEventType:
      document.querySelector(
        "[data-workshop-event-type]",
      ),

    educationalWorkshopFields:
      document.querySelector(
        "[data-educational-workshop-fields]",
      ),

    communityEventFields:
      document.querySelector(
        "[data-community-event-fields]",
      ),

    workshopCatalog:
      document.querySelector(
        "[data-workshop-catalog]",
      ),

    workshopCatalogType:
      document.querySelector(
        "[data-workshop-catalog-type]",
      ),

    newCatalogButton:
      document.querySelector(
        "[data-new-catalog]",
      ),

    workshopCommunityName:
      document.querySelector(
        "[data-workshop-community-name]",
      ),

    workshopDate:
      document.querySelector(
        "[data-workshop-date]",
      ),

    workshopParticipants:
      document.querySelector(
        "[data-workshop-participants]",
      ),

    workshopStartTime:
      document.querySelector(
        "[data-workshop-start-time]",
      ),

    workshopEndTime:
      document.querySelector(
        "[data-workshop-end-time]",
      ),

    workshopNotes:
      document.querySelector(
        "[data-workshop-notes]",
      ),

    workshopStatus:
      document.querySelector(
        "[data-workshop-status]",
      ),

    workshopSave:
      document.querySelector(
        "[data-workshop-save]",
      ),

    workshopCloseButtons:
      document.querySelectorAll(
        "[data-workshop-dialog-close]",
      ),


    /* CATÁLOGO */

    catalogDialog:
      document.getElementById(
        "workshopCatalogDialog",
      ),

    catalogForm:
      document.getElementById(
        "workshopCatalogForm",
      ),

    catalogRegional:
      document.querySelector(
        "[data-catalog-regional]",
      ),

    catalogName:
      document.querySelector(
        "[data-catalog-name]",
      ),

    catalogType:
      document.querySelector(
        "[data-catalog-type]",
      ),

    catalogStatus:
      document.querySelector(
        "[data-catalog-status]",
      ),

    catalogSave:
      document.querySelector(
        "[data-catalog-save]",
      ),

    catalogCloseButtons:
      document.querySelectorAll(
        "[data-catalog-dialog-close]",
      ),


    /* ESCOLA */

    schoolDialog:
      document.getElementById(
        "schoolDialog",
      ),

    schoolForm:
      document.getElementById(
        "schoolForm",
      ),

    schoolRegional:
      document.querySelector(
        "[data-school-regional]",
      ),

    schoolName:
      document.querySelector(
        "[data-school-name]",
      ),

    schoolCep:
      document.querySelector(
        "[data-school-cep]",
      ),

    schoolCepSearch:
      document.querySelector(
        "[data-school-cep-search]",
      ),

    schoolStreet:
      document.querySelector(
        "[data-school-street]",
      ),

    schoolNumber:
      document.querySelector(
        "[data-school-number]",
      ),

    schoolComplement:
      document.querySelector(
        "[data-school-complement]",
      ),

    schoolNeighborhood:
      document.querySelector(
        "[data-school-neighborhood]",
      ),

    schoolCity:
      document.querySelector(
        "[data-school-city]",
      ),

    schoolState:
      document.querySelector(
        "[data-school-state]",
      ),

    schoolContactName:
      document.querySelector(
        "[data-school-contact-name]",
      ),

    schoolContactRole:
      document.querySelector(
        "[data-school-contact-role]",
      ),

    schoolContactPhone:
      document.querySelector(
        "[data-school-contact-phone]",
      ),

    schoolContactEmail:
      document.querySelector(
        "[data-school-contact-email]",
      ),

    schoolStatus:
      document.querySelector(
        "[data-school-status]",
      ),

    schoolSave:
      document.querySelector(
        "[data-school-save]",
      ),

    schoolCloseButtons:
      document.querySelectorAll(
        "[data-school-dialog-close]",
      ),


    /* CANCELAMENTO */

    cancelDialog:
      document.getElementById(
        "workshopCancelDialog",
      ),

    cancelForm:
      document.getElementById(
        "workshopCancelForm",
      ),

    cancelReason:
      document.querySelector(
        "[data-cancel-reason]",
      ),

    cancelStatus:
      document.querySelector(
        "[data-cancel-status]",
      ),

    cancelSubmit:
      document.querySelector(
        "[data-cancel-submit]",
      ),

    cancelCloseButtons:
      document.querySelectorAll(
        "[data-cancel-dialog-close]",
      ),
  };
}


/* =========================================================
   UTILIDADES
========================================================= */

function normalizeSearchText(
  value,
) {
  return String(
    value || "",
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .toLowerCase()
    .trim();
}


function normalizeOptionalText(
  value,
) {
  const normalized =
    String(
      value || "",
    )
      .trim();


  return normalized ||
    null;
}


function onlyDigits(
  value,
) {
  return String(
    value || "",
  )
    .replace(
      /\D/g,
      "",
    );
}


function formatCep(
  value,
) {
  const digits =
    onlyDigits(
      value,
    )
      .slice(
        0,
        8,
      );


  if (
    digits.length <=
    5
  ) {
    return digits;
  }


  return (
    digits.slice(
      0,
      5,
    ) +
    "-" +
    digits.slice(
      5,
    )
  );
}


function formatDateBR(
  value,
) {
  if (!value) {
    return "—";
  }


  const [
    year,
    month,
    day,
  ] =
    value.split(
      "-",
    );


  return `${day}/${month}/${year}`;
}


function formatTime(
  value,
) {
  return String(
    value || "",
  )
    .slice(
      0,
      5,
    );
}


function getEventTypeLabel(
  value,
) {
  if (
    value ===
    EVENT_TYPES
      .COMMUNITY_EVENT
  ) {
    return "Evento à Comunidade";
  }


  return "Oficina Educacional";
}


function getRegionalById(
  id,
) {
  return (
    regionals.find(
      (regional) =>
        regional.id === id,
    ) ||
    null
  );
}


function getSchoolById(
  id,
) {
  return (
    schools.find(
      (school) =>
        school.id === id,
    ) ||
    null
  );
}


function getCatalogItemById(
  id,
) {
  return (
    catalogItems.find(
      (item) =>
        item.id === id,
    ) ||
    null
  );
}


function getWorkshopById(
  id,
) {
  return (
    workshops.find(
      (workshop) =>
        workshop.id === id,
    ) ||
    null
  );
}


function setPageMessage(
  elements,
  message = "",
  state = "",
) {
  if (!elements.message) {
    return;
  }


  elements.message.textContent =
    message;

  elements.message.dataset.state =
    state;
}


function setWorkshopStatus(
  elements,
  message = "",
  state = "",
) {
  if (!elements.workshopStatus) {
    return;
  }


  elements.workshopStatus.textContent =
    message;

  elements.workshopStatus.dataset.state =
    state;
}


function setCatalogStatus(
  elements,
  message = "",
  state = "",
) {
  if (!elements.catalogStatus) {
    return;
  }


  elements.catalogStatus.textContent =
    message;

  elements.catalogStatus.dataset.state =
    state;
}


function setSchoolStatus(
  elements,
  message = "",
  state = "",
) {
  if (!elements.schoolStatus) {
    return;
  }


  elements.schoolStatus.textContent =
    message;

  elements.schoolStatus.dataset.state =
    state;
}


function setCancelStatus(
  elements,
  message = "",
  state = "",
) {
  if (!elements.cancelStatus) {
    return;
  }


  elements.cancelStatus.textContent =
    message;

  elements.cancelStatus.dataset.state =
    state;
}


/* =========================================================
   CARREGAMENTO
========================================================= */

async function loadRegionals() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "regionais",
      )
      .select(`
        id,
        nome,
        codigo,
        ativo,
        ordem
      `)
      .order(
        "ordem",
        {
          ascending:
            true,
        },
      );


  if (error) {
    throw error;
  }


  regionals =
    Array.isArray(data)
      ? data
      : [];
}


async function loadSchools() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "escolas",
      )
      .select(`
        id,
        regional_id,
        nome,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        ibge_codigo,
        contato_nome,
        contato_cargo,
        contato_telefone,
        contato_email,
        ativo
      `)
      .order(
        "nome",
        {
          ascending:
            true,
        },
      );


  if (error) {
    throw error;
  }


  schools =
    Array.isArray(data)
      ? data
      : [];
}


async function loadCatalogItems() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "catalogo_oficinas",
      )
      .select(`
        id,
        regional_id,
        nome_oficina,
        tipo_oficina,
        ativo
      `)
      .order(
        "nome_oficina",
        {
          ascending:
            true,
        },
      );


  if (error) {
    throw error;
  }


  catalogItems =
    Array.isArray(data)
      ? data
      : [];
}


async function loadWorkshops() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "oficinas",
      )
      .select(`
        id,
        tipo_evento,
        regional_id,
        escola_id,
        catalogo_oficina_id,
        atividade,
        data,
        hora_inicio,
        hora_fim,
        participantes_previstos,
        observacoes,
        status,
        cancelamento_motivo,
        created_at,
        updated_at
      `)
      .order(
        "data",
        {
          ascending:
            true,
        },
      )
      .order(
        "hora_inicio",
        {
          ascending:
            true,
        },
      );


  if (error) {
    throw error;
  }


  workshops =
    Array.isArray(data)
      ? data
      : [];
}


/* =========================================================
   SELECTS
========================================================= */

function populateRegionalSelect(
  select,
  {
    includeAll = false,
    activeOnly = true,
  } = {},
) {
  if (!select) {
    return;
  }


  const previousValue =
    select.value;


  select.replaceChildren();


  if (includeAll) {
    const option =
      document.createElement(
        "option",
      );

    option.value =
      "all";

    option.textContent =
      "Todas";

    select.append(
      option,
    );
  }


  regionals
    .filter(
      (regional) =>
        !activeOnly ||
        regional.ativo,
    )
    .forEach(
      (regional) => {
        const option =
          document.createElement(
            "option",
          );

        option.value =
          regional.id;

        option.textContent =
          regional.nome;

        select.append(
          option,
        );
      },
    );


  if (
    previousValue &&
    Array.from(
      select.options,
    ).some(
      (option) =>
        option.value ===
        previousValue,
    )
  ) {
    select.value =
      previousValue;
  }
}


function populateSchoolFilter(
  elements,
) {
  if (!elements.schoolFilter) {
    return;
  }


  const previousValue =
    elements.schoolFilter.value;


  const regionalId =
    elements.regionalFilter
      ?.value ||
    "all";


  elements.schoolFilter
    .replaceChildren();


  const allOption =
    document.createElement(
      "option",
    );

  allOption.value =
    "all";

  allOption.textContent =
    "Todas";


  elements.schoolFilter.append(
    allOption,
  );


  schools
    .filter(
      (school) =>
        regionalId ===
          "all" ||
        school.regional_id ===
          regionalId,
    )
    .forEach(
      (school) => {
        const option =
          document.createElement(
            "option",
          );

        option.value =
          school.id;

        option.textContent =
          school.nome;

        elements.schoolFilter.append(
          option,
        );
      },
    );


  if (
    Array.from(
      elements.schoolFilter.options,
    ).some(
      (option) =>
        option.value ===
        previousValue,
    )
  ) {
    elements.schoolFilter.value =
      previousValue;
  }
}


/* =========================================================
   CATÁLOGO
========================================================= */

function populateWorkshopCatalog(
  elements,
) {
  if (!elements.workshopCatalog) {
    return;
  }


  const previousValue =
    elements.workshopCatalog.value;


  const regionalId =
    elements.workshopRegional
      ?.value;


  const currentWorkshop =
    getWorkshopById(
      selectedWorkshopId,
    );


  elements.workshopCatalog
    .replaceChildren();


  const placeholder =
    document.createElement(
      "option",
    );

  placeholder.value =
    "";

  placeholder.textContent =
    "Selecione uma oficina";


  elements.workshopCatalog.append(
    placeholder,
  );


  catalogItems
    .filter(
      (item) =>
        item.regional_id ===
          regionalId &&
        (
          item.ativo ||
          item.id ===
            currentWorkshop
              ?.catalogo_oficina_id
        ),
    )
    .forEach(
      (item) => {
        const option =
          document.createElement(
            "option",
          );

        option.value =
          item.id;

        option.textContent =
          item.nome_oficina;

        elements.workshopCatalog.append(
          option,
        );
      },
    );


  if (
    Array.from(
      elements.workshopCatalog.options,
    ).some(
      (option) =>
        option.value ===
        previousValue,
    )
  ) {
    elements.workshopCatalog.value =
      previousValue;
  }


  renderSelectedCatalogType(
    elements,
  );
}


function renderSelectedCatalogType(
  elements,
) {
  const item =
    getCatalogItemById(
      elements.workshopCatalog
        ?.value,
    );


  if (
    elements.workshopCatalogType
  ) {
    elements.workshopCatalogType.textContent =
      item?.tipo_oficina ||
      "—";
  }
}


/* =========================================================
   TIPO DE EVENTO
========================================================= */

function renderEventTypeFields(
  elements,
) {
  const type =
    elements.workshopEventType
      ?.value ||
    EVENT_TYPES
      .EDUCATIONAL_WORKSHOP;


  const isWorkshop =
    type ===
    EVENT_TYPES
      .EDUCATIONAL_WORKSHOP;


  if (
    elements.educationalWorkshopFields
  ) {
    elements.educationalWorkshopFields.hidden =
      !isWorkshop;
  }


  if (
    elements.communityEventFields
  ) {
    elements.communityEventFields.hidden =
      isWorkshop;
  }


  if (
    elements.workshopCatalog
  ) {
    elements.workshopCatalog.required =
      isWorkshop;
  }


  if (
    elements.workshopCommunityName
  ) {
    elements.workshopCommunityName.required =
      !isWorkshop;
  }
}


/* =========================================================
   RESUMO
========================================================= */

function renderSummary(
  elements,
) {
  const total =
    workshops.length;


  const scheduled =
    workshops.filter(
      (workshop) =>
        workshop.status ===
        "agendada",
    ).length;


  const cancelled =
    workshops.filter(
      (workshop) =>
        workshop.status ===
        "cancelada",
    ).length;


  elements.total.textContent =
    String(total);


  elements.scheduled.textContent =
    String(scheduled);


  elements.cancelled.textContent =
    String(cancelled);
}


/* =========================================================
   FILTROS
========================================================= */

function getFilteredWorkshops(
  elements,
) {
  const search =
    normalizeSearchText(
      elements.search?.value,
    );


  const regionalId =
    elements.regionalFilter
      ?.value ||
    "all";


  const schoolId =
    elements.schoolFilter
      ?.value ||
    "all";


  const type =
    elements.typeFilter
      ?.value ||
    "all";


  const status =
    elements.statusFilter
      ?.value ||
    "all";


  const dateStart =
    elements.dateStart
      ?.value ||
    "";


  const dateEnd =
    elements.dateEnd
      ?.value ||
    "";


  return workshops.filter(
    (workshop) => {
      const school =
        getSchoolById(
          workshop.escola_id,
        );


      const regional =
        getRegionalById(
          workshop.regional_id,
        );


      const catalog =
        getCatalogItemById(
          workshop.catalogo_oficina_id,
        );


      const searchable =
        normalizeSearchText(
          [
            workshop.atividade,
            catalog?.tipo_oficina,
            school?.nome,
            regional?.nome,
            getEventTypeLabel(
              workshop.tipo_evento,
            ),
          ].join(
            " ",
          ),
        );


      return (
        (
          !search ||
          searchable.includes(
            search,
          )
        ) &&
        (
          regionalId ===
            "all" ||
          workshop.regional_id ===
            regionalId
        ) &&
        (
          schoolId ===
            "all" ||
          workshop.escola_id ===
            schoolId
        ) &&
        (
          type ===
            "all" ||
          workshop.tipo_evento ===
            type
        ) &&
        (
          status ===
            "all" ||
          workshop.status ===
            status
        ) &&
        (
          !dateStart ||
          workshop.data >=
            dateStart
        ) &&
        (
          !dateEnd ||
          workshop.data <=
            dateEnd
        )
      );
    },
  );
}


/* =========================================================
   TABELA
========================================================= */

function createDateCell(
  workshop,
) {
  const cell =
    document.createElement(
      "td",
    );


  const wrapper =
    document.createElement(
      "div",
    );

  wrapper.className =
    "workshops-date";


  const date =
    document.createElement(
      "strong",
    );

  date.textContent =
    formatDateBR(
      workshop.data,
    );


  const time =
    document.createElement(
      "span",
    );

  time.textContent =
    (
      formatTime(
        workshop.hora_inicio,
      ) +
      "–" +
      formatTime(
        workshop.hora_fim,
      )
    );


  wrapper.append(
    date,
    time,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


function createSchoolCell(
  workshop,
) {
  const cell =
    document.createElement(
      "td",
    );


  const school =
    getSchoolById(
      workshop.escola_id,
    );


  const wrapper =
    document.createElement(
      "div",
    );

  wrapper.className =
    "workshops-school";


  const name =
    document.createElement(
      "strong",
    );

  name.textContent =
    school?.nome ||
    "Escola não encontrada";


  wrapper.append(
    name,
  );


  const location =
    [
      school?.cidade,
      school?.uf,
    ]
      .filter(
        Boolean,
      )
      .join(
        " - ",
      );


  if (location) {
    const span =
      document.createElement(
        "span",
      );

    span.textContent =
      location;

    wrapper.append(
      span,
    );
  }


  cell.append(
    wrapper,
  );


  return cell;
}


function createRegionalCell(
  workshop,
) {
  const cell =
    document.createElement(
      "td",
    );


  const regional =
    getRegionalById(
      workshop.regional_id,
    );


  cell.className =
    "workshops-regional-cell";


  if (
    regional?.codigo
  ) {
    cell.classList.add(
      `workshops-regional-${regional.codigo}`,
    );
  }


  const label =
    document.createElement(
      "span",
    );

  label.textContent =
    regional?.nome ||
    "—";


  cell.append(
    label,
  );


  return cell;
}


function createActivityCell(
  workshop,
) {
  const cell =
    document.createElement(
      "td",
    );


  const catalog =
    getCatalogItemById(
      workshop.catalogo_oficina_id,
    );


  const wrapper =
    document.createElement(
      "div",
    );

  wrapper.className =
    "workshops-activity";


  const activity =
    document.createElement(
      "strong",
    );

  activity.textContent =
    workshop.atividade;


  const type =
    document.createElement(
      "span",
    );

  type.className =
    workshop.tipo_evento ===
      EVENT_TYPES.COMMUNITY_EVENT
      ? "workshops-event-type workshops-event-type-community"
      : "workshops-event-type workshops-event-type-educational";


  type.textContent =
    getEventTypeLabel(
      workshop.tipo_evento,
    );


  wrapper.append(
    activity,
    type,
  );


  if (
    workshop.tipo_evento ===
      EVENT_TYPES.EDUCATIONAL_WORKSHOP &&
    catalog?.tipo_oficina
  ) {
    const catalogType =
      document.createElement(
        "span",
      );

    catalogType.textContent =
      `Tipo da oficina: ${catalog.tipo_oficina}`;

    wrapper.append(
      catalogType,
    );
  }


  if (
    workshop.participantes_previstos !==
      null
  ) {
    const participants =
      document.createElement(
        "span",
      );

    participants.textContent =
      `${workshop.participantes_previstos} participantes previstos`;

    wrapper.append(
      participants,
    );
  }


  cell.append(
    wrapper,
  );


  return cell;
}


function createStatusCell(
  workshop,
) {
  const cell =
    document.createElement(
      "td",
    );


  const badge =
    document.createElement(
      "span",
    );


  badge.className =
    (
      "workshops-status " +
      `workshops-status-${workshop.status}`
    );


  const labels = {
    agendada:
      "Agendado",

    cancelada:
      "Cancelado",

    realizada:
      "Realizado",
  };


  badge.textContent =
    labels[
      workshop.status
    ] ||
    workshop.status;


  cell.append(
    badge,
  );


  return cell;
}


function createActionButton(
  label,
  callback,
) {
  const button =
    document.createElement(
      "button",
    );


  button.type =
    "button";

  button.className =
    "btn btn-ghost";

  button.textContent =
    label;


  button.addEventListener(
    "click",
    callback,
  );


  return button;
}


function createActionCell(
  workshop,
  elements,
) {
  const cell =
    document.createElement(
      "td",
    );


  const actions =
    document.createElement(
      "div",
    );

  actions.className =
    "workshops-actions";


  const canEdit =
    hasPermission(
      PERMISSIONS
        .WORKSHOPS_RESCHEDULE,
    );


  if (
    workshop.status ===
      "agendada" &&
    canEdit
  ) {
    actions.append(
      createActionButton(
        "Editar",
        () => {
          openEditWorkshop(
            workshop.id,
            elements,
          );
        },
      ),

      createActionButton(
        "Cancelar",
        () => {
          openCancelDialog(
            workshop.id,
            elements,
          );
        },
      ),
    );
  }


  if (
    workshop.status ===
      "cancelada" &&
    canEdit
  ) {
    actions.append(
      createActionButton(
        "Reativar",
        async () => {
          await reactivateWorkshop(
            workshop.id,
            elements,
          );
        },
      ),
    );
  }


  if (
    workshop.status ===
      "realizada"
  ) {
    const label =
      document.createElement(
        "span",
      );

    label.className =
      "workshops-completed-label";

    label.textContent =
      "Concluído";

    actions.append(
      label,
    );
  }


  cell.append(
    actions,
  );


  return cell;
}


function renderTable(
  elements,
) {
  const filtered =
    getFilteredWorkshops(
      elements,
    );


  elements.tableBody
    .replaceChildren();


  elements.empty.hidden =
    filtered.length > 0;


  filtered.forEach(
    (workshop) => {
      const row =
        document.createElement(
          "tr",
        );


      row.append(
        createDateCell(
          workshop,
        ),

        createSchoolCell(
          workshop,
        ),

        createRegionalCell(
          workshop,
        ),

        createActivityCell(
          workshop,
        ),

        createStatusCell(
          workshop,
        ),

        createActionCell(
          workshop,
          elements,
        ),
      );


      elements.tableBody.append(
        row,
      );
    },
  );
}


function render(
  elements,
) {
  renderSummary(
    elements,
  );


  populateSchoolFilter(
    elements,
  );


  renderTable(
    elements,
  );
}


/* =========================================================
   ESCOLA PESQUISÁVEL
========================================================= */

function clearSelectedSchool(
  elements,
) {
  selectedSchoolId =
    null;


  elements.workshopSchoolSearch.value =
    "";
}


function hideSchoolResults(
  elements,
) {
  elements.workshopSchoolResults.hidden =
    true;
}


function selectSchool(
  school,
  elements,
) {
  selectedSchoolId =
    school.id;


  elements.workshopSchoolSearch.value =
    school.nome;


  hideSchoolResults(
    elements,
  );
}


function renderSchoolSuggestions(
  elements,
) {
  const container =
    elements.workshopSchoolResults;


  const regionalId =
    elements.workshopRegional
      ?.value;


  if (!regionalId) {
    container.hidden =
      true;

    return;
  }


  const search =
    normalizeSearchText(
      elements.workshopSchoolSearch
        ?.value,
    );


  const results =
    schools
      .filter(
        (school) =>
          school.ativo &&
          school.regional_id ===
            regionalId,
      )
      .filter(
        (school) =>
          !search ||
          normalizeSearchText(
            school.nome,
          ).includes(
            search,
          ),
      )
      .slice(
        0,
        12,
      );


  container.replaceChildren();


  if (!results.length) {
    const empty =
      document.createElement(
        "div",
      );

    empty.className =
      "workshops-school-empty";

    empty.textContent =
      "Nenhuma escola encontrada.";

    container.append(
      empty,
    );

    container.hidden =
      false;

    return;
  }


  results.forEach(
    (school) => {
      const button =
        document.createElement(
          "button",
        );


      button.type =
        "button";

      button.className =
        "workshops-school-option";


      const name =
        document.createElement(
          "strong",
        );

      name.textContent =
        school.nome;


      button.append(
        name,
      );


      const location =
        [
          school.cidade,
          school.uf,
        ]
          .filter(
            Boolean,
          )
          .join(
            " - ",
          );


      if (location) {
        const span =
          document.createElement(
            "span",
          );

        span.textContent =
          location;

        button.append(
          span,
        );
      }


      button.addEventListener(
        "click",
        () => {
          selectSchool(
            school,
            elements,
          );
        },
      );


      container.append(
        button,
      );
    },
  );


  container.hidden =
    false;
}


/* =========================================================
   ABRIR NOVO EVENTO
========================================================= */

function resetWorkshopForm(
  elements,
) {
  elements.workshopForm.reset();


  selectedWorkshopId =
    null;

  selectedSchoolId =
    null;


  setWorkshopStatus(
    elements,
  );


  hideSchoolResults(
    elements,
  );


  elements.workshopEventType.value =
    EVENT_TYPES
      .EDUCATIONAL_WORKSHOP;


  const firstRegional =
    regionals.find(
      (regional) =>
        regional.ativo,
    );


  if (firstRegional) {
    elements.workshopRegional.value =
      firstRegional.id;
  }


  populateWorkshopCatalog(
    elements,
  );


  renderEventTypeFields(
    elements,
  );
}


function openCreateWorkshop(
  elements,
) {
  resetWorkshopForm(
    elements,
  );


  elements.workshopKicker.textContent =
    "Novo agendamento";


  elements.workshopTitle.textContent =
    "Novo evento";


  elements.workshopSave.textContent =
    "Agendar evento";


  elements.workshopDialog.showModal();
}


/* =========================================================
   EDITAR EVENTO
========================================================= */

function openEditWorkshop(
  workshopId,
  elements,
) {
  const workshop =
    getWorkshopById(
      workshopId,
    );


  if (!workshop) {
    return;
  }


  selectedWorkshopId =
    workshop.id;


  elements.workshopKicker.textContent =
    "Agendamento existente";


  elements.workshopTitle.textContent =
    "Editar evento";


  elements.workshopRegional.value =
    workshop.regional_id;


  elements.workshopEventType.value =
    workshop.tipo_evento ||
    EVENT_TYPES
      .EDUCATIONAL_WORKSHOP;


  populateWorkshopCatalog(
    elements,
  );


  elements.workshopCatalog.value =
    workshop.catalogo_oficina_id ||
    "";


  renderSelectedCatalogType(
    elements,
  );


  elements.workshopCommunityName.value =
    workshop.tipo_evento ===
      EVENT_TYPES.COMMUNITY_EVENT
      ? workshop.atividade || ""
      : "";


  const school =
    getSchoolById(
      workshop.escola_id,
    );


  selectedSchoolId =
    workshop.escola_id;


  elements.workshopSchoolSearch.value =
    school?.nome ||
    "";


  elements.workshopDate.value =
    workshop.data ||
    "";


  elements.workshopParticipants.value =
    workshop.participantes_previstos ??
    "";


  elements.workshopStartTime.value =
    formatTime(
      workshop.hora_inicio,
    );


  elements.workshopEndTime.value =
    formatTime(
      workshop.hora_fim,
    );


  elements.workshopNotes.value =
    workshop.observacoes ||
    "";


  elements.workshopSave.textContent =
    "Salvar alterações";


  renderEventTypeFields(
    elements,
  );


  setWorkshopStatus(
    elements,
  );


  elements.workshopDialog.showModal();
}


function closeWorkshopDialog(
  elements,
) {
  selectedWorkshopId =
    null;

  selectedSchoolId =
    null;


  if (
    elements.workshopDialog.open
  ) {
    elements.workshopDialog.close();
  }


  hideSchoolResults(
    elements,
  );


  setWorkshopStatus(
    elements,
  );
}


/* =========================================================
   SALVAR EVENTO
========================================================= */

async function saveWorkshop(
  elements,
) {
  const isEditing =
    Boolean(
      selectedWorkshopId,
    );


  const workshopId =
    selectedWorkshopId;


  const regionalId =
    elements.workshopRegional.value;


  const school =
    getSchoolById(
      selectedSchoolId,
    );


  const tipoEvento =
    elements.workshopEventType.value;


  const data =
    elements.workshopDate.value;


  const horaInicio =
    elements.workshopStartTime.value;


  const horaFim =
    elements.workshopEndTime.value;


  const participantValue =
    elements.workshopParticipants.value
      .trim();


  const observacoes =
    normalizeOptionalText(
      elements.workshopNotes.value,
    );


  if (!regionalId) {
    setWorkshopStatus(
      elements,
      "Selecione a Regional.",
      "error",
    );

    return;
  }


  if (!school) {
    setWorkshopStatus(
      elements,
      "Selecione uma escola da lista.",
      "error",
    );

    return;
  }


  if (
    school.regional_id !==
    regionalId
  ) {
    setWorkshopStatus(
      elements,
      "A escola não pertence à Regional selecionada.",
      "error",
    );

    return;
  }


  let catalogItem =
    null;


  let activity =
    "";


  if (
    tipoEvento ===
    EVENT_TYPES
      .EDUCATIONAL_WORKSHOP
  ) {
    catalogItem =
      getCatalogItemById(
        elements.workshopCatalog.value,
      );


    if (!catalogItem) {
      setWorkshopStatus(
        elements,
        "Selecione uma Oficina Educacional.",
        "error",
      );

      elements.workshopCatalog.focus();

      return;
    }


    if (
      catalogItem.regional_id !==
      regionalId
    ) {
      setWorkshopStatus(
        elements,
        "A oficina não pertence à Regional selecionada.",
        "error",
      );

      return;
    }


    if (!catalogItem.ativo) {
      setWorkshopStatus(
        elements,
        "A oficina selecionada está inativa.",
        "error",
      );

      return;
    }


    activity =
      catalogItem.nome_oficina;

  } else if (
    tipoEvento ===
    EVENT_TYPES
      .COMMUNITY_EVENT
  ) {
    activity =
      elements.workshopCommunityName.value
        .trim();


    if (!activity) {
      setWorkshopStatus(
        elements,
        "Informe o nome do Evento à Comunidade.",
        "error",
      );

      elements.workshopCommunityName.focus();

      return;
    }

  } else {

    setWorkshopStatus(
      elements,
      "Selecione um tipo de evento válido.",
      "error",
    );

    return;
  }


  if (!data) {
    setWorkshopStatus(
      elements,
      "Informe a data.",
      "error",
    );

    return;
  }


  if (
    !horaInicio ||
    !horaFim
  ) {
    setWorkshopStatus(
      elements,
      "Informe os horários inicial e final.",
      "error",
    );

    return;
  }


  if (
    horaFim <=
    horaInicio
  ) {
    setWorkshopStatus(
      elements,
      "O horário final precisa ser posterior ao inicial.",
      "error",
    );

    return;
  }


  const participantes =
    participantValue
      ? Number(
        participantValue,
      )
      : null;


  if (
    participantes !==
      null &&
    (
      !Number.isInteger(
        participantes,
      ) ||
      participantes < 0
    )
  ) {
    setWorkshopStatus(
      elements,
      "Informe uma quantidade válida de participantes.",
      "error",
    );

    return;
  }


  const payload = {
    tipo_evento:
      tipoEvento,

    regional_id:
      regionalId,

    escola_id:
      school.id,

    catalogo_oficina_id:
      catalogItem?.id ||
      null,

    atividade:
      activity,

    data,

    hora_inicio:
      horaInicio,

    hora_fim:
      horaFim,

    participantes_previstos:
      participantes,

    observacoes,
  };


  if (!isEditing) {
    payload.status =
      "agendada";

    payload.cancelamento_motivo =
      null;
  }


  elements.workshopSave.disabled =
    true;


  elements.workshopSave.textContent =
    "Salvando...";


  setWorkshopStatus(
    elements,
    "Salvando evento...",
    "loading",
  );


  try {
    let result;


    if (isEditing) {
      result =
        await supabase
          .from(
            "oficinas",
          )
          .update(
            payload,
          )
          .eq(
            "id",
            workshopId,
          )
          .select()
          .single();

    } else {

      result =
        await supabase
          .from(
            "oficinas",
          )
          .insert(
            payload,
          )
          .select()
          .single();
    }


    if (result.error) {
      throw result.error;
    }


    await loadWorkshops();


    render(
      elements,
    );


    closeWorkshopDialog(
      elements,
    );


    setPageMessage(
      elements,
      isEditing
        ? "Evento atualizado com sucesso."
        : "Evento agendado com sucesso.",
      "success",
    );

  } catch (error) {

    console.error(
      "[YXZ] Erro ao salvar evento:",
      error,
    );


    setWorkshopStatus(
      elements,
      error?.message ||
      "Não foi possível salvar o evento.",
      "error",
    );

  } finally {

    elements.workshopSave.disabled =
      false;


    elements.workshopSave.textContent =
      isEditing
        ? "Salvar alterações"
        : "Agendar evento";
  }
}


/* =========================================================
   CATÁLOGO
========================================================= */

function openCatalogDialog(
  elements,
) {
  elements.catalogForm.reset();


  elements.catalogRegional.value =
    elements.workshopRegional.value;


  setCatalogStatus(
    elements,
  );


  elements.catalogDialog.showModal();


  requestAnimationFrame(
    () => {
      elements.catalogName.focus();
    },
  );
}


function closeCatalogDialog(
  elements,
) {
  if (
    elements.catalogDialog.open
  ) {
    elements.catalogDialog.close();
  }


  setCatalogStatus(
    elements,
  );
}


async function saveCatalogItem(
  elements,
) {
  const regionalId =
    elements.catalogRegional.value;


  const nome =
    elements.catalogName.value
      .trim();


  const tipo =
    elements.catalogType.value
      .trim();


  if (
    !regionalId ||
    !nome ||
    !tipo
  ) {
    setCatalogStatus(
      elements,
      "Preencha Regional, nome e tipo da oficina.",
      "error",
    );

    return;
  }


  const existing =
    catalogItems.find(
      (item) =>
        item.regional_id ===
          regionalId &&
        normalizeSearchText(
          item.nome_oficina,
        ) ===
        normalizeSearchText(
          nome,
        ),
    );


  if (existing) {
    elements.workshopRegional.value =
      regionalId;


    populateWorkshopCatalog(
      elements,
    );


    elements.workshopCatalog.value =
      existing.id;


    renderSelectedCatalogType(
      elements,
    );


    closeCatalogDialog(
      elements,
    );


    setWorkshopStatus(
      elements,
      "A oficina já estava cadastrada e foi selecionada.",
      "info",
    );


    return;
  }


  elements.catalogSave.disabled =
    true;


  elements.catalogSave.textContent =
    "Cadastrando...";


  try {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "catalogo_oficinas",
        )
        .insert({
          regional_id:
            regionalId,

          nome_oficina:
            nome,

          tipo_oficina:
            tipo,

          ativo:
            true,
        })
        .select(`
          id,
          regional_id,
          nome_oficina,
          tipo_oficina,
          ativo
        `)
        .single();


    if (error) {
      throw error;
    }


    catalogItems.push(
      data,
    );


    catalogItems.sort(
      (a, b) =>
        a.nome_oficina.localeCompare(
          b.nome_oficina,
          "pt-BR",
          {
            sensitivity:
              "base",
          },
        ),
    );


    elements.workshopRegional.value =
      data.regional_id;


    populateWorkshopCatalog(
      elements,
    );


    elements.workshopCatalog.value =
      data.id;


    renderSelectedCatalogType(
      elements,
    );


    closeCatalogDialog(
      elements,
    );


    setWorkshopStatus(
      elements,
      "Oficina cadastrada e selecionada.",
      "success",
    );

  } catch (error) {

    console.error(
      "[YXZ] Erro ao cadastrar oficina:",
      error,
    );


    setCatalogStatus(
      elements,
      error?.code ===
        "23505"
        ? "Já existe uma oficina com este nome nesta Regional."
        : "Não foi possível cadastrar a oficina.",
      "error",
    );

  } finally {

    elements.catalogSave.disabled =
      false;


    elements.catalogSave.textContent =
      "Cadastrar oficina";
  }
}


/* =========================================================
   ESCOLA
========================================================= */

function openSchoolDialog(
  elements,
) {
  elements.schoolForm.reset();


  setSchoolStatus(
    elements,
  );


  elements.schoolRegional.value =
    elements.workshopRegional.value;


  const typedName =
    elements.workshopSchoolSearch.value
      .trim();


  if (typedName) {
    elements.schoolName.value =
      typedName;
  }


  elements.schoolDialog.showModal();
}


function closeSchoolDialog(
  elements,
) {
  if (
    elements.schoolDialog.open
  ) {
    elements.schoolDialog.close();
  }


  setSchoolStatus(
    elements,
  );
}


/* =========================================================
   CEP
========================================================= */

async function lookupCep(
  elements,
) {
  const cep =
    onlyDigits(
      elements.schoolCep.value,
    );


  if (
    cep.length !==
    8
  ) {
    setSchoolStatus(
      elements,
      "Informe um CEP com 8 dígitos.",
      "error",
    );

    return;
  }


  elements.schoolCepSearch.disabled =
    true;


  elements.schoolCepSearch.textContent =
    "Buscando...";


  try {
    const response =
      await fetch(
        `https://viacep.com.br/ws/${cep}/json/`,
      );


    if (!response.ok) {
      throw new Error(
        "Falha na consulta.",
      );
    }


    const data =
      await response.json();


    if (data?.erro) {
      setSchoolStatus(
        elements,
        "CEP não encontrado.",
        "error",
      );

      return;
    }


    elements.schoolCep.value =
      formatCep(
        cep,
      );


    elements.schoolStreet.value =
      data.logradouro ||
      "";


    elements.schoolNeighborhood.value =
      data.bairro ||
      "";


    elements.schoolCity.value =
      data.localidade ||
      "";


    elements.schoolState.value =
      data.uf ||
      "";


    elements.schoolCep.dataset.ibge =
      data.ibge ||
      "";


    setSchoolStatus(
      elements,
      "Endereço preenchido pelo CEP.",
      "success",
    );


    elements.schoolNumber.focus();

  } catch (error) {

    console.error(
      "[YXZ] Falha ao consultar CEP:",
      error,
    );


    setSchoolStatus(
      elements,
      "Não foi possível consultar o CEP. Preencha manualmente.",
      "error",
    );

  } finally {

    elements.schoolCepSearch.disabled =
      false;


    elements.schoolCepSearch.textContent =
      "Buscar CEP";
  }
}


/* =========================================================
   SALVAR ESCOLA
========================================================= */

async function saveSchool(
  elements,
) {
  const regionalId =
    elements.schoolRegional.value;


  const nome =
    elements.schoolName.value
      .trim();


  const cep =
    onlyDigits(
      elements.schoolCep.value,
    );


  if (
    !regionalId ||
    !nome
  ) {
    setSchoolStatus(
      elements,
      "Informe a Regional e o nome da escola.",
      "error",
    );

    return;
  }


  if (
    cep &&
    cep.length !==
      8
  ) {
    setSchoolStatus(
      elements,
      "O CEP precisa possuir 8 dígitos.",
      "error",
    );

    return;
  }


  const existing =
    schools.find(
      (school) =>
        school.regional_id ===
          regionalId &&
        normalizeSearchText(
          school.nome,
        ) ===
        normalizeSearchText(
          nome,
        ),
    );


  if (existing) {
    elements.workshopRegional.value =
      regionalId;


    selectSchool(
      existing,
      elements,
    );


    closeSchoolDialog(
      elements,
    );


    return;
  }


  elements.schoolSave.disabled =
    true;


  elements.schoolSave.textContent =
    "Cadastrando...";


  try {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "escolas",
        )
        .insert({
          regional_id:
            regionalId,

          nome,

          cep:
            cep || null,

          logradouro:
            normalizeOptionalText(
              elements.schoolStreet.value,
            ),

          numero:
            normalizeOptionalText(
              elements.schoolNumber.value,
            ),

          complemento:
            normalizeOptionalText(
              elements.schoolComplement.value,
            ),

          bairro:
            normalizeOptionalText(
              elements.schoolNeighborhood.value,
            ),

          cidade:
            normalizeOptionalText(
              elements.schoolCity.value,
            ),

          uf:
            normalizeOptionalText(
              elements.schoolState.value,
            )?.toUpperCase() ||
            null,

          ibge_codigo:
            elements.schoolCep.dataset.ibge ||
            null,

          contato_nome:
            normalizeOptionalText(
              elements.schoolContactName.value,
            ),

          contato_cargo:
            normalizeOptionalText(
              elements.schoolContactRole.value,
            ),

          contato_telefone:
            normalizeOptionalText(
              elements.schoolContactPhone.value,
            ),

          contato_email:
            normalizeOptionalText(
              elements.schoolContactEmail.value,
            ),

          ativo:
            true,
        })
        .select()
        .single();


    if (error) {
      throw error;
    }


    schools.push(
      data,
    );


    elements.workshopRegional.value =
      data.regional_id;


    selectSchool(
      data,
      elements,
    );


    populateSchoolFilter(
      elements,
    );


    closeSchoolDialog(
      elements,
    );

  } catch (error) {

    console.error(
      "[YXZ] Erro ao cadastrar escola:",
      error,
    );


    setSchoolStatus(
      elements,
      error?.code ===
        "23505"
        ? "Esta escola já está cadastrada nesta Regional."
        : "Não foi possível cadastrar a escola.",
      "error",
    );

  } finally {

    elements.schoolSave.disabled =
      false;


    elements.schoolSave.textContent =
      "Cadastrar escola";
  }
}


/* =========================================================
   CANCELAMENTO
========================================================= */

function openCancelDialog(
  workshopId,
  elements,
) {
  cancelWorkshopId =
    workshopId;


  elements.cancelForm.reset();


  setCancelStatus(
    elements,
  );


  elements.cancelDialog.showModal();
}


function closeCancelDialog(
  elements,
) {
  cancelWorkshopId =
    null;


  if (
    elements.cancelDialog.open
  ) {
    elements.cancelDialog.close();
  }


  setCancelStatus(
    elements,
  );
}


async function cancelWorkshop(
  elements,
) {
  const workshop =
    getWorkshopById(
      cancelWorkshopId,
    );


  const reason =
    elements.cancelReason.value
      .trim();


  if (
    !workshop ||
    !reason
  ) {
    setCancelStatus(
      elements,
      "Informe o motivo do cancelamento.",
      "error",
    );

    return;
  }


  try {
    const {
      error,
    } =
      await supabase
        .from(
          "oficinas",
        )
        .update({
          status:
            "cancelada",

          cancelamento_motivo:
            reason,
        })
        .eq(
          "id",
          workshop.id,
        );


    if (error) {
      throw error;
    }


    await loadWorkshops();


    render(
      elements,
    );


    closeCancelDialog(
      elements,
    );


    setPageMessage(
      elements,
      "Evento cancelado com sucesso.",
      "success",
    );

  } catch (error) {

    console.error(
      "[YXZ] Erro ao cancelar evento:",
      error,
    );


    setCancelStatus(
      elements,
      "Não foi possível cancelar o evento.",
      "error",
    );
  }
}


/* =========================================================
   REATIVAR
========================================================= */

async function reactivateWorkshop(
  workshopId,
  elements,
) {
  try {
    const {
      error,
    } =
      await supabase
        .from(
          "oficinas",
        )
        .update({
          status:
            "agendada",

          cancelamento_motivo:
            null,
        })
        .eq(
          "id",
          workshopId,
        );


    if (error) {
      throw error;
    }


    await loadWorkshops();


    render(
      elements,
    );


    setPageMessage(
      elements,
      "Evento reativado com sucesso.",
      "success",
    );

  } catch (error) {

    console.error(
      "[YXZ] Erro ao reativar evento:",
      error,
    );


    setPageMessage(
      elements,
      "Não foi possível reativar o evento.",
      "error",
    );
  }
}


/* =========================================================
   EVENTOS DA INTERFACE
========================================================= */

function bindEvents(
  elements,
) {
  elements.newButton
    ?.addEventListener(
      "click",
      () => {
        openCreateWorkshop(
          elements,
        );
      },
    );


  elements.search
    ?.addEventListener(
      "input",
      () => {
        renderTable(
          elements,
        );
      },
    );


  elements.regionalFilter
    ?.addEventListener(
      "change",
      () => {
        populateSchoolFilter(
          elements,
        );

        renderTable(
          elements,
        );
      },
    );


  [
    elements.schoolFilter,
    elements.typeFilter,
    elements.statusFilter,
    elements.dateStart,
    elements.dateEnd,
  ].forEach(
    (element) => {
      element?.addEventListener(
        "change",
        () => {
          renderTable(
            elements,
          );
        },
      );
    },
  );


  elements.workshopRegional
    ?.addEventListener(
      "change",
      () => {
        clearSelectedSchool(
          elements,
        );


        populateWorkshopCatalog(
          elements,
        );
      },
    );


  elements.workshopEventType
    ?.addEventListener(
      "change",
      () => {
        renderEventTypeFields(
          elements,
        );
      },
    );


  elements.workshopCatalog
    ?.addEventListener(
      "change",
      () => {
        renderSelectedCatalogType(
          elements,
        );
      },
    );


  elements.workshopSchoolSearch
    ?.addEventListener(
      "input",
      () => {
        selectedSchoolId =
          null;


        renderSchoolSuggestions(
          elements,
        );
      },
    );


  elements.workshopSchoolSearch
    ?.addEventListener(
      "focus",
      () => {
        renderSchoolSuggestions(
          elements,
        );
      },
    );


  elements.newSchoolButton
    ?.addEventListener(
      "click",
      () => {
        openSchoolDialog(
          elements,
        );
      },
    );


  elements.newCatalogButton
    ?.addEventListener(
      "click",
      () => {
        openCatalogDialog(
          elements,
        );
      },
    );


  elements.workshopForm
    ?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();


        await saveWorkshop(
          elements,
        );
      },
    );


  elements.catalogForm
    ?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();


        await saveCatalogItem(
          elements,
        );
      },
    );


  elements.schoolForm
    ?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();


        await saveSchool(
          elements,
        );
      },
    );


  elements.cancelForm
    ?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();


        await cancelWorkshop(
          elements,
        );
      },
    );


  elements.schoolCep
    ?.addEventListener(
      "input",
      () => {
        elements.schoolCep.value =
          formatCep(
            elements.schoolCep.value,
          );


        elements.schoolCep.dataset.ibge =
          "";
      },
    );


  elements.schoolCepSearch
    ?.addEventListener(
      "click",
      async () => {
        await lookupCep(
          elements,
        );
      },
    );


  elements.workshopCloseButtons
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            closeWorkshopDialog(
              elements,
            );
          },
        );
      },
    );


  elements.catalogCloseButtons
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            closeCatalogDialog(
              elements,
            );
          },
        );
      },
    );


  elements.schoolCloseButtons
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            closeSchoolDialog(
              elements,
            );
          },
        );
      },
    );


  elements.cancelCloseButtons
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            closeCancelDialog(
              elements,
            );
          },
        );
      },
    );


  document.addEventListener(
    "pointerdown",
    (event) => {
      if (
        elements.schoolCombobox &&
        !elements.schoolCombobox.contains(
          event.target,
        )
      ) {
        hideSchoolResults(
          elements,
        );
      }
    },
  );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

export async function initAgendamentosPage() {
  const elements =
    getElements();


  bindEvents(
    elements,
  );


  /*
   * Master, Administrador e Coordenador
   * podem cadastrar oficinas no catálogo.
   */
  if (
    elements.newCatalogButton
  ) {
    elements.newCatalogButton.hidden =
      !hasPermission(
        PERMISSIONS
          .SCHEDULES_MANAGE,
      );
  }


  try {
    setPageMessage(
      elements,
      "Carregando eventos...",
      "loading",
    );


    await Promise.all([
      loadRegionals(),
      loadSchools(),
      loadCatalogItems(),
      loadWorkshops(),
    ]);


    populateRegionalSelect(
      elements.regionalFilter,
      {
        includeAll:
          true,

        activeOnly:
          false,
      },
    );


    populateRegionalSelect(
      elements.workshopRegional,
    );


    populateRegionalSelect(
      elements.schoolRegional,
    );


    populateRegionalSelect(
      elements.catalogRegional,
    );


    populateWorkshopCatalog(
      elements,
    );


    renderEventTypeFields(
      elements,
    );


    render(
      elements,
    );


    setPageMessage(
      elements,
      "",
    );

  } catch (error) {

    console.error(
      "[YXZ] Erro ao carregar Agendamento de Eventos:",
      error,
    );


    elements.tableBody
      ?.replaceChildren();


    setPageMessage(
      elements,
      "Não foi possível carregar o módulo de Agendamento de Eventos.",
      "error",
    );
  }
}