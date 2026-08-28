import {
  supabase,
} from "./supabase.js";


const EVENT_TYPES = {
  EDUCATIONAL_WORKSHOP:
    "oficina_educacional",

  COMMUNITY_EVENT:
    "evento_comunidade",
};


let regionals = [];
let schools = [];
let instructors = [];
let instructorRegionals = [];
let events = [];
let scales = [];

let selectedEventId =
  null;


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-scales-message]",
      ),

    eventsCount:
      document.querySelector(
        "[data-scales-events]",
      ),

    withScale:
      document.querySelector(
        "[data-scales-with-scale]",
      ),

    withoutScale:
      document.querySelector(
        "[data-scales-without-scale]",
      ),

    instructorsCount:
      document.querySelector(
        "[data-scales-instructors]",
      ),

    search:
      document.querySelector(
        "[data-scales-search]",
      ),

    regionalFilter:
      document.querySelector(
        "[data-scales-regional-filter]",
      ),

    typeFilter:
      document.querySelector(
        "[data-scales-type-filter]",
      ),

    statusFilter:
      document.querySelector(
        "[data-scales-status-filter]",
      ),

    dateStart:
      document.querySelector(
        "[data-scales-date-start]",
      ),

    dateEnd:
      document.querySelector(
        "[data-scales-date-end]",
      ),

    tableBody:
      document.querySelector(
        "[data-scales-table-body]",
      ),

    empty:
      document.querySelector(
        "[data-scales-empty]",
      ),


    /* MODAL */

    dialog:
      document.getElementById(
        "scaleDialog",
      ),

    form:
      document.getElementById(
        "scaleForm",
      ),

    closeButtons:
      document.querySelectorAll(
        "[data-scale-dialog-close]",
      ),

    eventType:
      document.querySelector(
        "[data-scale-event-type]",
      ),

    eventName:
      document.querySelector(
        "[data-scale-event-name]",
      ),

    eventSchool:
      document.querySelector(
        "[data-scale-event-school]",
      ),

    eventRegional:
      document.querySelector(
        "[data-scale-event-regional]",
      ),

    eventDate:
      document.querySelector(
        "[data-scale-event-date]",
      ),

    eventTime:
      document.querySelector(
        "[data-scale-event-time]",
      ),

    instructorSearch:
      document.querySelector(
        "[data-scale-instructor-search]",
      ),

    instructorList:
      document.querySelector(
        "[data-scale-instructor-list]",
      ),

    selectedCount:
      document.querySelector(
        "[data-scale-selected-count]",
      ),

    status:
      document.querySelector(
        "[data-scale-status]",
      ),

    save:
      document.querySelector(
        "[data-scale-save]",
      ),
  };
}


/* =========================================================
   UTILIDADES
========================================================= */

function normalizeText(
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
    EVENT_TYPES.COMMUNITY_EVENT
  ) {
    return "Evento à Comunidade";
  }


  return "Oficina Educacional";
}


function getEventById(
  eventId,
) {
  return (
    events.find(
      (event) =>
        event.id === eventId,
    ) ||
    null
  );
}


function getSchoolById(
  schoolId,
) {
  return (
    schools.find(
      (school) =>
        school.id === schoolId,
    ) ||
    null
  );
}


function getRegionalById(
  regionalId,
) {
  return (
    regionals.find(
      (regional) =>
        regional.id === regionalId,
    ) ||
    null
  );
}


function getInstructorById(
  instructorId,
) {
  return (
    instructors.find(
      (instructor) =>
        instructor.id === instructorId,
    ) ||
    null
  );
}


function getScaleForEvent(
  eventId,
) {
  return scales.filter(
    (scale) =>
      scale.evento_id ===
      eventId,
  );
}


function getInstructorIdsForEvent(
  eventId,
) {
  return getScaleForEvent(
    eventId,
  )
    .map(
      (scale) =>
        scale.instrutor_id,
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


function setDialogStatus(
  elements,
  message = "",
  state = "",
) {
  if (!elements.status) {
    return;
  }


  elements.status.textContent =
    message;


  elements.status.dataset.state =
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
        cidade,
        uf,
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


async function loadInstructors() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "instrutores",
      )
      .select(`
        id,
        nome,
        email,
        telefone,
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


  instructors =
    Array.isArray(data)
      ? data
      : [];
}


async function loadInstructorRegionals() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "instrutor_regionais",
      )
      .select(`
        instrutor_id,
        regional_id
      `);


  if (error) {
    throw error;
  }


  instructorRegionals =
    Array.isArray(data)
      ? data
      : [];
}


async function loadEvents() {
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
        atividade,
        data,
        hora_inicio,
        hora_fim,
        participantes_previstos,
        status
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


  events =
    Array.isArray(data)
      ? data
      : [];
}


async function loadScales() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "escalas",
      )
      .select(`
        id,
        evento_id,
        instrutor_id,
        created_at
      `);


  if (error) {
    throw error;
  }


  scales =
    Array.isArray(data)
      ? data
      : [];
}


async function reloadScales() {
  await loadScales();
}


/* =========================================================
   FILTRO REGIONAL
========================================================= */

function populateRegionalFilter(
  elements,
) {
  const select =
    elements.regionalFilter;


  if (!select) {
    return;
  }


  const previousValue =
    select.value;


  select.replaceChildren();


  const allOption =
    document.createElement(
      "option",
    );


  allOption.value =
    "all";


  allOption.textContent =
    "Todas";


  select.append(
    allOption,
  );


  regionals.forEach(
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


/* =========================================================
   RESUMO
========================================================= */

function renderSummary(
  elements,
) {
  const scheduledEvents =
    events.filter(
      (event) =>
        event.status ===
        "agendada",
    );


  const eventsWithScale =
    scheduledEvents.filter(
      (event) =>
        getScaleForEvent(
          event.id,
        ).length > 0,
    );


  const eventsWithoutScale =
    scheduledEvents.filter(
      (event) =>
        getScaleForEvent(
          event.id,
        ).length === 0,
    );


  const scheduledInstructorIds =
    new Set();


  scheduledEvents.forEach(
    (event) => {
      getScaleForEvent(
        event.id,
      ).forEach(
        (scale) => {
          scheduledInstructorIds.add(
            scale.instrutor_id,
          );
        },
      );
    },
  );


  elements.eventsCount.textContent =
    String(
      scheduledEvents.length,
    );


  elements.withScale.textContent =
    String(
      eventsWithScale.length,
    );


  elements.withoutScale.textContent =
    String(
      eventsWithoutScale.length,
    );


  elements.instructorsCount.textContent =
    String(
      scheduledInstructorIds.size,
    );
}


/* =========================================================
   FILTROS
========================================================= */

function getFilteredEvents(
  elements,
) {
  const search =
    normalizeText(
      elements.search
        ?.value,
    );


  const regionalId =
    elements.regionalFilter
      ?.value ||
    "all";


  const type =
    elements.typeFilter
      ?.value ||
    "all";


  const status =
    elements.statusFilter
      ?.value ||
    "agendada";


  const dateStart =
    elements.dateStart
      ?.value ||
    "";


  const dateEnd =
    elements.dateEnd
      ?.value ||
    "";


  return events.filter(
    (event) => {
      const school =
        getSchoolById(
          event.escola_id,
        );


      const regional =
        getRegionalById(
          event.regional_id,
        );


      const searchable =
        normalizeText(
          [
            event.atividade,
            school?.nome,
            regional?.nome,
            getEventTypeLabel(
              event.tipo_evento,
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
        )

        && (
          regionalId ===
            "all" ||
          event.regional_id ===
            regionalId
        )

        && (
          type ===
            "all" ||
          event.tipo_evento ===
            type
        )

        && (
          status ===
            "all" ||
          event.status ===
            status
        )

        && (
          !dateStart ||
          event.data >=
            dateStart
        )

        && (
          !dateEnd ||
          event.data <=
            dateEnd
        )
      );
    },
  );
}


/* =========================================================
   CÉLULA DATA
========================================================= */

function createDateCell(
  event,
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
    "scales-date";


  const date =
    document.createElement(
      "strong",
    );


  date.textContent =
    formatDateBR(
      event.data,
    );


  const time =
    document.createElement(
      "span",
    );


  time.textContent =
    (
      formatTime(
        event.hora_inicio,
      ) +
      "–" +
      formatTime(
        event.hora_fim,
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


/* =========================================================
   CÉLULA EVENTO
========================================================= */

function createEventCell(
  event,
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
    "scales-event";


  const name =
    document.createElement(
      "strong",
    );


  name.textContent =
    event.atividade;


  const type =
    document.createElement(
      "span",
    );


  type.className =
    event.tipo_evento ===
      EVENT_TYPES.COMMUNITY_EVENT
      ? "scales-event-type scales-event-type-community"
      : "scales-event-type scales-event-type-educational";


  type.textContent =
    getEventTypeLabel(
      event.tipo_evento,
    );


  wrapper.append(
    name,
    type,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


/* =========================================================
   ESCOLA
========================================================= */

function createSchoolCell(
  event,
) {
  const cell =
    document.createElement(
      "td",
    );


  const school =
    getSchoolById(
      event.escola_id,
    );


  const wrapper =
    document.createElement(
      "div",
    );


  wrapper.className =
    "scales-school";


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


/* =========================================================
   REGIONAL
========================================================= */

function createRegionalCell(
  event,
) {
  const cell =
    document.createElement(
      "td",
    );


  const regional =
    getRegionalById(
      event.regional_id,
    );


  cell.className =
    "scales-regional-cell";


  if (
    regional?.codigo
  ) {
    cell.classList.add(
      `scales-regional-${regional.codigo}`,
    );
  }


  const text =
    document.createElement(
      "span",
    );


  text.textContent =
    regional?.nome ||
    "—";


  cell.append(
    text,
  );


  return cell;
}


/* =========================================================
   ESCALA
========================================================= */

function createScaleCell(
  event,
) {
  const cell =
    document.createElement(
      "td",
    );


  const eventScale =
    getScaleForEvent(
      event.id,
    );


  if (
    eventScale.length ===
    0
  ) {
    const empty =
      document.createElement(
        "span",
      );


    empty.className =
      "scales-without-instructor";


    empty.textContent =
      "Sem escala";


    cell.append(
      empty,
    );


    return cell;
  }


  const wrapper =
    document.createElement(
      "div",
    );


  wrapper.className =
    "scales-instructor-badges";


  eventScale.forEach(
    (scale) => {
      const instructor =
        getInstructorById(
          scale.instrutor_id,
        );


      const badge =
        document.createElement(
          "span",
        );


      badge.className =
        "scales-instructor-badge";


      badge.textContent =
        instructor?.nome ||
        "Instrutor";


      wrapper.append(
        badge,
      );
    },
  );


  cell.append(
    wrapper,
  );


  return cell;
}


/* =========================================================
   AÇÕES
========================================================= */

function createActionsCell(
  event,
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
    "scales-actions";


  if (
    event.status ===
      "agendada"
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
      getScaleForEvent(
        event.id,
      ).length > 0
        ? "Editar escala"
        : "Montar escala";


    button.addEventListener(
      "click",
      () => {
        openScaleDialog(
          event.id,
          elements,
        );
      },
    );


    actions.append(
      button,
    );

  } else {

    const status =
      document.createElement(
        "span",
      );


    status.className =
      "scales-readonly-label";


    status.textContent =
      event.status ===
        "realizada"
        ? "Concluído"
        : "Cancelado";


    actions.append(
      status,
    );
  }


  cell.append(
    actions,
  );


  return cell;
}


/* =========================================================
   TABELA
========================================================= */

function renderTable(
  elements,
) {
  const filtered =
    getFilteredEvents(
      elements,
    );


  elements.tableBody
    .replaceChildren();


  elements.empty.hidden =
    filtered.length >
    0;


  filtered.forEach(
    (event) => {
      const row =
        document.createElement(
          "tr",
        );


      row.append(
        createDateCell(
          event,
        ),

        createEventCell(
          event,
        ),

        createSchoolCell(
          event,
        ),

        createRegionalCell(
          event,
        ),

        createScaleCell(
          event,
        ),

        createActionsCell(
          event,
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


  renderTable(
    elements,
  );
}


/* =========================================================
   CONFLITO
========================================================= */

function eventsOverlap(
  eventA,
  eventB,
) {
  if (
    eventA.data !==
    eventB.data
  ) {
    return false;
  }


  return (
    eventA.hora_inicio <
      eventB.hora_fim

    &&

    eventA.hora_fim >
      eventB.hora_inicio
  );
}


function getInstructorConflict(
  instructorId,
  currentEventId,
) {
  const currentEvent =
    getEventById(
      currentEventId,
    );


  if (!currentEvent) {
    return null;
  }


  const instructorScales =
    scales.filter(
      (scale) =>
        scale.instrutor_id ===
          instructorId

        &&
        scale.evento_id !==
          currentEventId,
    );


  for (
    const scale
    of instructorScales
  ) {
    const otherEvent =
      getEventById(
        scale.evento_id,
      );


    if (
      !otherEvent ||
      otherEvent.status ===
        "cancelada"
    ) {
      continue;
    }


    if (
      eventsOverlap(
        currentEvent,
        otherEvent,
      )
    ) {
      return otherEvent;
    }
  }


  return null;
}


/* =========================================================
   INSTRUTORES ELEGÍVEIS
========================================================= */

function instructorServesRegional(
  instructorId,
  regionalId,
) {
  return instructorRegionals.some(
    (relation) =>
      relation.instrutor_id ===
        instructorId

      &&
      relation.regional_id ===
        regionalId,
  );
}


function getCandidateInstructors(
  event,
) {
  const currentlyAssignedIds =
    getInstructorIdsForEvent(
      event.id,
    );


  return instructors
    .filter(
      (instructor) => {
        const alreadyAssigned =
          currentlyAssignedIds.includes(
            instructor.id,
          );


        const eligible =
          instructor.ativo

          &&
          instructorServesRegional(
            instructor.id,
            event.regional_id,
          );


        /*
         * Mesmo que o instrutor tenha sido
         * inativado depois da escala, ele ainda
         * aparece para permitir sua remoção.
         */
        return (
          eligible ||
          alreadyAssigned
        );
      },
    )
    .sort(
      (a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR",
          {
            sensitivity:
              "base",
          },
        ),
    );
}


/* =========================================================
   CONTADOR SELECIONADOS
========================================================= */

function updateSelectedCount(
  elements,
) {
  const selected =
    elements.instructorList
      .querySelectorAll(
        "input[data-scale-instructor]:checked",
      )
      .length;


  elements.selectedCount.textContent =
    selected === 1
      ? "1 selecionado"
      : `${selected} selecionados`;
}


/* =========================================================
   LISTA DE INSTRUTORES
========================================================= */

function renderInstructorList(
  elements,
) {
  const event =
    getEventById(
      selectedEventId,
    );


  if (!event) {
    return;
  }


  const search =
    normalizeText(
      elements.instructorSearch
        ?.value,
    );


  const assignedIds =
    getInstructorIdsForEvent(
      event.id,
    );


  const candidates =
    getCandidateInstructors(
      event,
    )
      .filter(
        (instructor) =>
          !search ||
          normalizeText(
            [
              instructor.nome,
              instructor.email,
              instructor.telefone,
            ].join(
              " ",
            ),
          ).includes(
            search,
          ),
      );


  elements.instructorList
    .replaceChildren();


  if (
    candidates.length ===
    0
  ) {
    const empty =
      document.createElement(
        "div",
      );


    empty.className =
      "scales-instructor-empty";


    const title =
      document.createElement(
        "strong",
      );


    title.textContent =
      "Nenhum instrutor disponível.";


    const text =
      document.createElement(
        "span",
      );


    text.textContent =
      search
        ? "Nenhum instrutor corresponde à busca."
        : "Cadastre ou relacione instrutores a esta Regional.";


    empty.append(
      title,
      text,
    );


    elements.instructorList.append(
      empty,
    );


    updateSelectedCount(
      elements,
    );


    return;
  }


  candidates.forEach(
    (instructor) => {
      const currentlyAssigned =
        assignedIds.includes(
          instructor.id,
        );


      const conflict =
        getInstructorConflict(
          instructor.id,
          event.id,
        );


      const isEligible =
        instructor.ativo

        &&
        instructorServesRegional(
          instructor.id,
          event.regional_id,
        );


      const option =
        document.createElement(
          "label",
        );


      option.className =
        "scales-instructor-option";


      if (
        conflict
      ) {
        option.classList.add(
          "scales-instructor-conflict",
        );
      }


      if (
        !isEligible
      ) {
        option.classList.add(
          "scales-instructor-invalid",
        );
      }


      const checkbox =
        document.createElement(
          "input",
        );


      checkbox.type =
        "checkbox";


      checkbox.value =
        instructor.id;


      checkbox.checked =
        currentlyAssigned;


      checkbox.dataset.scaleInstructor =
        instructor.id;


      /*
       * Um candidato com conflito não pode ser
       * adicionado.
       *
       * Se ele já estiver na escala, deixamos
       * habilitado para que possa ser removido.
       */
      checkbox.disabled =
        Boolean(
          conflict
        )

        &&
        !currentlyAssigned;


      const content =
        document.createElement(
          "span",
        );


      content.className =
        "scales-instructor-option-content";


      const top =
        document.createElement(
          "span",
        );


      top.className =
        "scales-instructor-option-top";


      const name =
        document.createElement(
          "strong",
        );


      name.textContent =
        instructor.nome;


      top.append(
        name,
      );


      const details =
        document.createElement(
          "small",
        );


      details.textContent =
        instructor.email ||
        instructor.telefone ||
        "Sem contato cadastrado";


      content.append(
        top,
        details,
      );


      if (
        conflict
      ) {
        const conflictSchool =
          getSchoolById(
            conflict.escola_id,
          );


        const warning =
          document.createElement(
            "span",
          );


        warning.className =
          "scales-conflict-message";


        warning.textContent =
          (
            "Indisponível: " +
            formatTime(
              conflict.hora_inicio,
            ) +
            "–" +
            formatTime(
              conflict.hora_fim,
            ) +
            " • " +
            (
              conflictSchool?.nome ||
              conflict.atividade
            )
          );


        content.append(
          warning,
        );

      } else if (
        !isEligible
      ) {

        const warning =
          document.createElement(
            "span",
          );


        warning.className =
          "scales-conflict-message";


        warning.textContent =
          instructor.ativo
            ? "Este instrutor não atende mais a Regional."
            : "Este instrutor está inativo.";


        content.append(
          warning,
        );

      } else {

        const available =
          document.createElement(
            "span",
          );


        available.className =
          "scales-available-message";


        available.textContent =
          "Disponível";


        content.append(
          available,
        );
      }


      checkbox.addEventListener(
        "change",
        () => {
          updateSelectedCount(
            elements,
          );
        },
      );


      option.append(
        checkbox,
        content,
      );


      elements.instructorList.append(
        option,
      );
    },
  );


  updateSelectedCount(
    elements,
  );
}


/* =========================================================
   MODAL
========================================================= */

function openScaleDialog(
  eventId,
  elements,
) {
  const event =
    getEventById(
      eventId,
    );


  if (
    !event ||
    !elements.dialog
  ) {
    return;
  }


  selectedEventId =
    event.id;


  const school =
    getSchoolById(
      event.escola_id,
    );


  const regional =
    getRegionalById(
      event.regional_id,
    );


  elements.eventType.textContent =
    getEventTypeLabel(
      event.tipo_evento,
    );


  elements.eventType.className =
    event.tipo_evento ===
      EVENT_TYPES.COMMUNITY_EVENT
      ? "scales-event-type scales-event-type-community"
      : "scales-event-type scales-event-type-educational";


  elements.eventName.textContent =
    event.atividade;


  elements.eventSchool.textContent =
    school?.nome ||
    "Escola não encontrada";


  elements.eventRegional.textContent =
    regional?.nome ||
    "—";


  elements.eventDate.textContent =
    formatDateBR(
      event.data,
    );


  elements.eventTime.textContent =
    (
      formatTime(
        event.hora_inicio,
      ) +
      "–" +
      formatTime(
        event.hora_fim,
      )
    );


  elements.instructorSearch.value =
    "";


  setDialogStatus(
    elements,
  );


  renderInstructorList(
    elements,
  );


  elements.dialog.showModal();
}


function closeScaleDialog(
  elements,
) {
  selectedEventId =
    null;


  if (
    elements.dialog?.open
  ) {
    elements.dialog.close();
  }


  setDialogStatus(
    elements,
  );
}


/* =========================================================
   IDS SELECIONADOS
========================================================= */

function getSelectedInstructorIds(
  elements,
) {
  return Array.from(
    elements.instructorList
      .querySelectorAll(
        "input[data-scale-instructor]:checked",
      ),
  )
    .map(
      (checkbox) =>
        checkbox.value,
    )
    .filter(
      Boolean,
    );
}


/* =========================================================
   SALVAR
========================================================= */

async function saveScale(
  elements,
) {
  const event =
    getEventById(
      selectedEventId,
    );


  if (!event) {
    return;
  }


  const instructorIds =
    getSelectedInstructorIds(
      elements,
    );


  /*
   * Verificação visual antes de chegar ao banco.
   * O banco continuará sendo a proteção definitiva.
   */
  for (
    const instructorId
    of instructorIds
  ) {
    const conflict =
      getInstructorConflict(
        instructorId,
        event.id,
      );


    if (conflict) {
      const instructor =
        getInstructorById(
          instructorId,
        );


      setDialogStatus(
        elements,
        `O instrutor "${instructor?.nome || "selecionado"}" possui conflito de horário.`,
        "error",
      );


      return;
    }
  }


  if (
    instructorIds.length ===
    0
  ) {
    const confirmed =
      window.confirm(
        "Nenhum instrutor foi selecionado. Deseja deixar este evento sem escala?",
      );


    if (!confirmed) {
      return;
    }
  }


  elements.save.disabled =
    true;


  elements.save.textContent =
    "Salvando...";


  setDialogStatus(
    elements,
    "Salvando escala...",
    "loading",
  );


  try {
    const {
      error,
    } =
      await supabase
        .rpc(
          "sync_event_scale",
          {
            p_evento_id:
              event.id,

            p_instrutor_ids:
              instructorIds,
          },
        );


    if (error) {
      throw error;
    }


    await reloadScales();


    render(
      elements,
    );


    closeScaleDialog(
      elements,
    );


    setPageMessage(
      elements,
      "Escala salva com sucesso.",
      "success",
    );

  } catch (error) {

    console.error(
      "[YXZ] Não foi possível salvar a escala:",
      error,
    );


    setDialogStatus(
      elements,
      error?.message ||
      "Não foi possível salvar a escala.",
      "error",
    );

  } finally {

    elements.save.disabled =
      false;


    elements.save.textContent =
      "Salvar escala";
  }
}


/* =========================================================
   EVENTOS
========================================================= */

function bindEvents(
  elements,
) {
  elements.search
    ?.addEventListener(
      "input",
      () => {
        renderTable(
          elements,
        );
      },
    );


  [
    elements.regionalFilter,
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


  elements.instructorSearch
    ?.addEventListener(
      "input",
      () => {
        renderInstructorList(
          elements,
        );
      },
    );


  elements.form
    ?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();


        await saveScale(
          elements,
        );
      },
    );


  elements.closeButtons
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            closeScaleDialog(
              elements,
            );
          },
        );
      },
    );


  elements.dialog
    ?.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          elements.dialog
        ) {
          closeScaleDialog(
            elements,
          );
        }
      },
    );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

export async function initEscalasPage() {
  const elements =
    getElements();


  bindEvents(
    elements,
  );


  try {
    setPageMessage(
      elements,
      "Carregando escalas...",
      "loading",
    );


    await Promise.all([
      loadRegionals(),
      loadSchools(),
      loadInstructors(),
      loadInstructorRegionals(),
      loadEvents(),
      loadScales(),
    ]);


    populateRegionalFilter(
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
      "[YXZ] Não foi possível carregar Escalas:",
      error,
    );


    elements.tableBody
      ?.replaceChildren();


    setPageMessage(
      elements,
      "Não foi possível carregar o módulo de Escalas.",
      "error",
    );
  }
}