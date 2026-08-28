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
let events = [];
let scales = [];
let executions = [];
let executionInstructors = [];

let selectedEventId =
  null;


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-executions-message]",
      ),

    pending:
      document.querySelector(
        "[data-executions-pending]",
      ),

    completed:
      document.querySelector(
        "[data-executions-completed]",
      ),

    withoutScale:
      document.querySelector(
        "[data-executions-without-scale]",
      ),

    participants:
      document.querySelector(
        "[data-executions-participants]",
      ),

    search:
      document.querySelector(
        "[data-executions-search]",
      ),

    regionalFilter:
      document.querySelector(
        "[data-executions-regional-filter]",
      ),

    typeFilter:
      document.querySelector(
        "[data-executions-type-filter]",
      ),

    statusFilter:
      document.querySelector(
        "[data-executions-status-filter]",
      ),

    dateStart:
      document.querySelector(
        "[data-executions-date-start]",
      ),

    dateEnd:
      document.querySelector(
        "[data-executions-date-end]",
      ),

    tableBody:
      document.querySelector(
        "[data-executions-table-body]",
      ),

    empty:
      document.querySelector(
        "[data-executions-empty]",
      ),


    /* MODAL */

    dialog:
      document.getElementById(
        "executionDialog",
      ),

    form:
      document.getElementById(
        "executionForm",
      ),

    kicker:
      document.querySelector(
        "[data-execution-dialog-kicker]",
      ),

    title:
      document.querySelector(
        "[data-execution-dialog-title]",
      ),

    eventType:
      document.querySelector(
        "[data-execution-event-type]",
      ),

    eventName:
      document.querySelector(
        "[data-execution-event-name]",
      ),

    eventSchool:
      document.querySelector(
        "[data-execution-event-school]",
      ),

    eventRegional:
      document.querySelector(
        "[data-execution-event-regional]",
      ),

    eventDate:
      document.querySelector(
        "[data-execution-event-date]",
      ),

    eventTime:
      document.querySelector(
        "[data-execution-event-time]",
      ),

    realDate:
      document.querySelector(
        "[data-execution-date]",
      ),

    participantsInput:
      document.querySelector(
        "[data-execution-participants]",
      ),

    startTime:
      document.querySelector(
        "[data-execution-start-time]",
      ),

    endTime:
      document.querySelector(
        "[data-execution-end-time]",
      ),

    notes:
      document.querySelector(
        "[data-execution-notes]",
      ),

    instructorList:
      document.querySelector(
        "[data-execution-instructor-list]",
      ),

    selectedCount:
      document.querySelector(
        "[data-execution-selected-count]",
      ),

    status:
      document.querySelector(
        "[data-execution-status]",
      ),

    save:
      document.querySelector(
        "[data-execution-save]",
      ),

    closeButtons:
      document.querySelectorAll(
        "[data-execution-dialog-close]",
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


function getExecutionForEvent(
  eventId,
) {
  return (
    executions.find(
      (execution) =>
        execution.evento_id === eventId,
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


function getExecutionInstructors(
  executionId,
) {
  return executionInstructors.filter(
    (item) =>
      item.execucao_id ===
      executionId,
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
    data || [];
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
        nome,
        cidade,
        uf,
        regional_id,
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
    data || [];
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
    data || [];
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
        observacoes,
        status
      `)
      .order(
        "data",
        {
          ascending:
            false,
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
    data || [];
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
        instrutor_id
      `);


  if (error) {
    throw error;
  }


  scales =
    data || [];
}


async function loadExecutions() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "evento_execucoes",
      )
      .select(`
        id,
        evento_id,
        data_real,
        hora_inicio_real,
        hora_fim_real,
        participantes_reais,
        observacoes,
        created_at,
        updated_at
      `);


  if (error) {
    throw error;
  }


  executions =
    data || [];
}


async function loadExecutionInstructors() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "execucao_instrutores",
      )
      .select(`
        execucao_id,
        instrutor_id,
        hora_inicio_real,
        hora_fim_real
      `);


  if (error) {
    throw error;
  }


  executionInstructors =
    data || [];
}


async function reloadOperationalData() {
  await Promise.all([
    loadEvents(),
    loadExecutions(),
    loadExecutionInstructors(),
  ]);
}


/* =========================================================
   FILTRO REGIONAL
========================================================= */

function populateRegionalFilter(
  elements,
) {
  const select =
    elements.regionalFilter;


  const previousValue =
    select.value;


  select.replaceChildren();


  const all =
    document.createElement(
      "option",
    );


  all.value =
    "all";


  all.textContent =
    "Todas";


  select.append(
    all,
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
  const pending =
    events.filter(
      (event) =>
        event.status ===
        "agendada",
    );


  const completed =
    events.filter(
      (event) =>
        event.status ===
        "realizada",
    );


  const withoutScale =
    pending.filter(
      (event) =>
        getScaleForEvent(
          event.id,
        ).length ===
        0,
    );


  const participants =
    executions.reduce(
      (
        total,
        execution,
      ) => {
        return (
          total +
          (
            execution.participantes_reais ||
            0
          )
        );
      },
      0,
    );


  elements.pending.textContent =
    String(
      pending.length,
    );


  elements.completed.textContent =
    String(
      completed.length,
    );


  elements.withoutScale.textContent =
    String(
      withoutScale.length,
    );


  elements.participants.textContent =
    String(
      participants,
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
      elements.search.value,
    );


  const regionalId =
    elements.regionalFilter.value;


  const type =
    elements.typeFilter.value;


  const status =
    elements.statusFilter.value;


  const dateStart =
    elements.dateStart.value;


  const dateEnd =
    elements.dateEnd.value;


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
   CÉLULAS
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
    "executions-date";


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
    "executions-event";


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
      ? "executions-event-type executions-event-type-community"
      : "executions-event-type executions-event-type-educational";


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
    "executions-school";


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
    "executions-regional-cell";


  if (
    regional?.codigo
  ) {
    cell.classList.add(
      `executions-regional-${regional.codigo}`,
    );
  }


  const span =
    document.createElement(
      "span",
    );


  span.textContent =
    regional?.nome ||
    "—";


  cell.append(
    span,
  );


  return cell;
}


function createExecutionCell(
  event,
) {
  const cell =
    document.createElement(
      "td",
    );


  const execution =
    getExecutionForEvent(
      event.id,
    );


  if (!execution) {
    const pending =
      document.createElement(
        "span",
      );


    pending.className =
      "executions-pending-label";


    pending.textContent =
      "Pendente";


    cell.append(
      pending,
    );


    return cell;
  }


  const wrapper =
    document.createElement(
      "div",
    );


  wrapper.className =
    "executions-result";


  const date =
    document.createElement(
      "strong",
    );


  date.textContent =
    formatDateBR(
      execution.data_real,
    );


  const time =
    document.createElement(
      "span",
    );


  time.textContent =
    (
      formatTime(
        execution.hora_inicio_real,
      ) +
      "–" +
      formatTime(
        execution.hora_fim_real,
      )
    );


  wrapper.append(
    date,
    time,
  );


  if (
    execution.participantes_reais !==
    null
  ) {
    const participants =
      document.createElement(
        "small",
      );


    participants.textContent =
      `${execution.participantes_reais} participantes`;


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
  event,
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
      "executions-status " +
      `executions-status-${event.status}`
    );


  const labels = {
    agendada:
      "Pendente",

    realizada:
      "Realizado",

    cancelada:
      "Cancelado",
  };


  badge.textContent =
    labels[
      event.status
    ] ||
    event.status;


  cell.append(
    badge,
  );


  return cell;
}


function createActionsCell(
  event,
  elements,
) {
  const cell =
    document.createElement(
      "td",
    );


  const execution =
    getExecutionForEvent(
      event.id,
    );


  if (
    event.status ===
    "cancelada"
  ) {
    const text =
      document.createElement(
        "span",
      );


    text.className =
      "executions-readonly-label";


    text.textContent =
      "Cancelado";


    cell.append(
      text,
    );


    return cell;
  }


  const button =
    document.createElement(
      "button",
    );


  button.type =
    "button";


  button.className =
    "btn btn-ghost";


  button.textContent =
    execution
      ? "Editar execução"
      : "Registrar execução";


  button.addEventListener(
    "click",
    () => {
      openExecutionDialog(
        event.id,
        elements,
      );
    },
  );


  cell.append(
    button,
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

        createExecutionCell(
          event,
        ),

        createStatusCell(
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
   CONTADOR DE PRESENTES
========================================================= */

function updateSelectedCount(
  elements,
) {
  const count =
    elements.instructorList
      .querySelectorAll(
        "input[data-execution-instructor]:checked",
      )
      .length;


  elements.selectedCount.textContent =
    count === 1
      ? "1 presente"
      : `${count} presentes`;
}


/* =========================================================
   ATIVAR / DESATIVAR HORÁRIOS DO INSTRUTOR
========================================================= */

function updateInstructorTimeFields(
  card,
) {
  const checkbox =
    card.querySelector(
      "input[data-execution-instructor]",
    );


  const timeInputs =
    card.querySelectorAll(
      "input[type='time']",
    );


  timeInputs.forEach(
    (input) => {
      input.disabled =
        !checkbox.checked;
    },
  );
}


/* =========================================================
   INSTRUTORES DO EVENTO
========================================================= */

function renderExecutionInstructors(
  event,
  execution,
  elements,
) {
  const eventScale =
    getScaleForEvent(
      event.id,
    );


  const previous =
    execution
      ? getExecutionInstructors(
          execution.id,
        )
      : [];


  elements.instructorList
    .replaceChildren();


  if (
    eventScale.length ===
    0
  ) {
    const empty =
      document.createElement(
        "div",
      );


    empty.className =
      "executions-instructor-empty";


    const title =
      document.createElement(
        "strong",
      );


    title.textContent =
      "Este evento não possui escala.";


    const description =
      document.createElement(
        "span",
      );


    description.textContent =
      "A execução pode ser registrada sem instrutores, mas nenhuma hora será gerada.";


    empty.append(
      title,
      description,
    );


    elements.instructorList.append(
      empty,
    );


    updateSelectedCount(
      elements,
    );


    return;
  }


  eventScale.forEach(
    (scale) => {
      const instructor =
        getInstructorById(
          scale.instrutor_id,
        );


      if (!instructor) {
        return;
      }


      const previousItem =
        previous.find(
          (item) =>
            item.instrutor_id ===
            instructor.id,
        );


      const card =
        document.createElement(
          "div",
        );


      card.className =
        "executions-instructor-option";


      const header =
        document.createElement(
          "label",
        );


      header.className =
        "executions-instructor-check";


      const checkbox =
        document.createElement(
          "input",
        );


      checkbox.type =
        "checkbox";


      checkbox.value =
        instructor.id;


      checkbox.dataset.executionInstructor =
        instructor.id;


      /*
       * Nova execução:
       * instrutores da escala começam marcados.
       *
       * Edição:
       * somente quem estava registrado como presente.
       */
      checkbox.checked =
        execution
          ? Boolean(
              previousItem,
            )
          : true;


      const info =
        document.createElement(
          "span",
        );


      const name =
        document.createElement(
          "strong",
        );


      name.textContent =
        instructor.nome;


      const contact =
        document.createElement(
          "small",
        );


      contact.textContent =
        instructor.email ||
        instructor.telefone ||
        "Sem contato cadastrado";


      info.append(
        name,
        contact,
      );


      header.append(
        checkbox,
        info,
      );


      const times =
        document.createElement(
          "div",
        );


      times.className =
        "executions-instructor-times";


      const startField =
        document.createElement(
          "label",
        );


      startField.textContent =
        "Entrada";


      const start =
        document.createElement(
          "input",
        );


      start.type =
        "time";


      start.dataset.executionInstructorStart =
        instructor.id;


      start.value =
        formatTime(
          previousItem
            ?.hora_inicio_real ||
          execution
            ?.hora_inicio_real ||
          event.hora_inicio,
        );


      startField.append(
        start,
      );


      const endField =
        document.createElement(
          "label",
        );


      endField.textContent =
        "Saída";


      const end =
        document.createElement(
          "input",
        );


      end.type =
        "time";


      end.dataset.executionInstructorEnd =
        instructor.id;


      end.value =
        formatTime(
          previousItem
            ?.hora_fim_real ||
          execution
            ?.hora_fim_real ||
          event.hora_fim,
        );


      endField.append(
        end,
      );


      times.append(
        startField,
        endField,
      );


      card.append(
        header,
        times,
      );


      checkbox.addEventListener(
        "change",
        () => {
          updateInstructorTimeFields(
            card,
          );


          updateSelectedCount(
            elements,
          );
        },
      );


      elements.instructorList.append(
        card,
      );


      updateInstructorTimeFields(
        card,
      );
    },
  );


  updateSelectedCount(
    elements,
  );
}


/* =========================================================
   ABRIR MODAL
========================================================= */

function openExecutionDialog(
  eventId,
  elements,
) {
  const event =
    getEventById(
      eventId,
    );


  if (!event) {
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


  const execution =
    getExecutionForEvent(
      event.id,
    );


  elements.kicker.textContent =
    execution
      ? "Execução registrada"
      : "Evento realizado";


  elements.title.textContent =
    execution
      ? "Editar execução"
      : "Registrar execução";


  elements.save.textContent =
    execution
      ? "Salvar alterações"
      : "Registrar execução";


  elements.eventType.textContent =
    getEventTypeLabel(
      event.tipo_evento,
    );


  elements.eventType.className =
    event.tipo_evento ===
      EVENT_TYPES.COMMUNITY_EVENT
      ? "executions-event-type executions-event-type-community"
      : "executions-event-type executions-event-type-educational";


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


  elements.realDate.value =
    execution?.data_real ||
    event.data;


  elements.startTime.value =
    formatTime(
      execution?.hora_inicio_real ||
      event.hora_inicio,
    );


  elements.endTime.value =
    formatTime(
      execution?.hora_fim_real ||
      event.hora_fim,
    );


  elements.participantsInput.value =
    execution
      ?.participantes_reais ??
    "";


  elements.notes.value =
    execution?.observacoes ||
    "";


  setDialogStatus(
    elements,
  );


  renderExecutionInstructors(
    event,
    execution,
    elements,
  );


  elements.dialog.showModal();
}


/* =========================================================
   FECHAR
========================================================= */

function closeExecutionDialog(
  elements,
) {
  selectedEventId =
    null;


  if (
    elements.dialog.open
  ) {
    elements.dialog.close();
  }


  setDialogStatus(
    elements,
  );
}


/* =========================================================
   MONTAR LISTA DE INSTRUTORES
========================================================= */

function getSelectedExecutionInstructors(
  elements,
) {
  const selected =
    [];


  const checkboxes =
    elements.instructorList
      .querySelectorAll(
        "input[data-execution-instructor]:checked",
      );


  for (
    const checkbox
    of checkboxes
  ) {
    const instructorId =
      checkbox.value;


    const start =
      elements.instructorList
        .querySelector(
          `[data-execution-instructor-start="${instructorId}"]`,
        )
        ?.value;


    const end =
      elements.instructorList
        .querySelector(
          `[data-execution-instructor-end="${instructorId}"]`,
        )
        ?.value;


    selected.push({
      instrutor_id:
        instructorId,

      hora_inicio_real:
        start,

      hora_fim_real:
        end,
    });
  }


  return selected;
}


/* =========================================================
   SALVAR EXECUÇÃO
========================================================= */

async function saveExecution(
  elements,
) {
  const event =
    getEventById(
      selectedEventId,
    );


  if (!event) {
    return;
  }


  const realDate =
    elements.realDate.value;


  const start =
    elements.startTime.value;


  const end =
    elements.endTime.value;


  const participantValue =
    elements.participantsInput
      .value
      .trim();


  const participants =
    participantValue
      ? Number(
          participantValue,
        )
      : null;


  const notes =
    elements.notes.value
      .trim() ||
    null;


  if (!realDate) {
    setDialogStatus(
      elements,
      "Informe a data realizada.",
      "error",
    );


    return;
  }


  if (
    !start ||
    !end
  ) {
    setDialogStatus(
      elements,
      "Informe o horário real do evento.",
      "error",
    );


    return;
  }


  if (
    end <=
    start
  ) {
    setDialogStatus(
      elements,
      "O horário final precisa ser posterior ao horário inicial.",
      "error",
    );


    return;
  }


  if (
    participants !==
      null

    &&
    (
      !Number.isInteger(
        participants,
      )

      ||
      participants < 0
    )
  ) {
    setDialogStatus(
      elements,
      "Informe uma quantidade válida de participantes.",
      "error",
    );


    return;
  }


  const selectedInstructors =
    getSelectedExecutionInstructors(
      elements,
    );


  for (
    const item
    of selectedInstructors
  ) {
    const instructor =
      getInstructorById(
        item.instrutor_id,
      );


    if (
      !item.hora_inicio_real ||
      !item.hora_fim_real
    ) {
      setDialogStatus(
        elements,
        `Informe os horários de "${instructor?.nome || "instrutor"}".`,
        "error",
      );


      return;
    }


    if (
      item.hora_fim_real <=
      item.hora_inicio_real
    ) {
      setDialogStatus(
        elements,
        `O horário de "${instructor?.nome || "instrutor"}" é inválido.`,
        "error",
      );


      return;
    }


    if (
      item.hora_inicio_real <
        start

      ||
      item.hora_fim_real >
        end
    ) {
      setDialogStatus(
        elements,
        `O horário de "${instructor?.nome || "instrutor"}" precisa estar dentro do horário real do evento.`,
        "error",
      );


      return;
    }
  }


  const eventScale =
    getScaleForEvent(
      event.id,
    );


  if (
    eventScale.length > 0 &&
    selectedInstructors.length === 0
  ) {
    const confirmed =
      window.confirm(
        "Nenhum instrutor da escala foi marcado como presente. Deseja continuar?",
      );


    if (!confirmed) {
      return;
    }
  }


  const wasEditing =
    Boolean(
      getExecutionForEvent(
        event.id,
      ),
    );


  elements.save.disabled =
    true;


  elements.save.textContent =
    "Salvando...";


  setDialogStatus(
    elements,
    "Salvando execução...",
    "loading",
  );


  try {
    const {
      error,
    } =
      await supabase
        .rpc(
          "register_event_execution",
          {
            p_evento_id:
              event.id,

            p_data_real:
              realDate,

            p_hora_inicio_real:
              start,

            p_hora_fim_real:
              end,

            p_participantes_reais:
              participants,

            p_observacoes:
              notes,

            p_instrutores:
              selectedInstructors,
          },
        );


    if (error) {
      throw error;
    }


    await reloadOperationalData();


    render(
      elements,
    );


    closeExecutionDialog(
      elements,
    );


    setPageMessage(
      elements,
      wasEditing
        ? "Execução atualizada com sucesso."
        : "Evento registrado como realizado com sucesso.",
      "success",
    );

  } catch (error) {

    console.error(
      "[YXZ] Não foi possível registrar a execução:",
      error,
    );


    setDialogStatus(
      elements,
      error?.message ||
      "Não foi possível registrar a execução.",
      "error",
    );

  } finally {

    elements.save.disabled =
      false;


    elements.save.textContent =
      wasEditing
        ? "Salvar alterações"
        : "Registrar execução";
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
      element
        ?.addEventListener(
          "change",
          () => {
            renderTable(
              elements,
            );
          },
        );
    },
  );


  elements.form
    ?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();


        await saveExecution(
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
            closeExecutionDialog(
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
          closeExecutionDialog(
            elements,
          );
        }
      },
    );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

export async function initExecucoesPage() {
  const elements =
    getElements();


  bindEvents(
    elements,
  );


  try {
    setPageMessage(
      elements,
      "Carregando execuções...",
      "loading",
    );


    await Promise.all([
      loadRegionals(),
      loadSchools(),
      loadInstructors(),
      loadEvents(),
      loadScales(),
      loadExecutions(),
      loadExecutionInstructors(),
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
      "[YXZ] Não foi possível carregar Execuções:",
      error,
    );


    elements.tableBody
      ?.replaceChildren();


    setPageMessage(
      elements,
      "Não foi possível carregar o módulo de Execuções.",
      "error",
    );
  }
}