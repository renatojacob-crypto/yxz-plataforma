import {
  supabase,
} from "./supabase.js";


const EVENT_TYPES = {
  EDUCATIONAL_WORKSHOP:
    "oficina_educacional",

  COMMUNITY_EVENT:
    "evento_comunidade",
};


const MAX_PHOTOS =
  6;


const MAX_ORIGINAL_FILE_SIZE =
  25 * 1024 * 1024;


const TARGET_UPLOAD_SIZE =
  4.5 * 1024 * 1024;


const MAX_IMAGE_DIMENSION =
  1920;


let regionals = [];
let schools = [];
let instructors = [];
let events = [];
let scales = [];
let executions = [];
let executionInstructors = [];
let executionPhotos = [];

let selectedEventId =
  null;

let pendingPhotos =
  [];

let previewObjectUrls =
  [];

let photoRenderVersion =
  0;


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

    drafts:
      document.querySelector(
        "[data-executions-drafts]",
      ),

    completed:
      document.querySelector(
        "[data-executions-completed]",
      ),

    withoutEvidence:
      document.querySelector(
        "[data-executions-without-evidence]",
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

    photoInput:
      document.querySelector(
        "[data-execution-photo-input]",
      ),

    addPhotosButton:
      document.querySelector(
        "[data-execution-add-photos]",
      ),

    photoGrid:
      document.querySelector(
        "[data-execution-photo-grid]",
      ),

    photoCount:
      document.querySelector(
        "[data-execution-photo-count]",
      ),

    photoEmpty:
      document.querySelector(
        "[data-execution-photo-empty]",
      ),

    status:
      document.querySelector(
        "[data-execution-status]",
      ),

    saveDraft:
      document.querySelector(
        "[data-execution-save-draft]",
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
    value ||
    "",
  )
    .normalize(
      "NFD",
    )
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
    value ||
    "",
  ).slice(
    0,
    5,
  );
}


function getEventTypeLabel(
  value,
) {
  return value ===
    EVENT_TYPES.COMMUNITY_EVENT
      ? "Evento à Comunidade"
      : "Oficina Educacional";
}


function getEventById(
  id,
) {
  return (
    events.find(
      (item) =>
        item.id ===
        id,
    ) ||
    null
  );
}


function getSchoolById(
  id,
) {
  return (
    schools.find(
      (item) =>
        item.id ===
        id,
    ) ||
    null
  );
}


function getRegionalById(
  id,
) {
  return (
    regionals.find(
      (item) =>
        item.id ===
        id,
    ) ||
    null
  );
}


function getInstructorById(
  id,
) {
  return (
    instructors.find(
      (item) =>
        item.id ===
        id,
    ) ||
    null
  );
}


function getExecutionForEvent(
  eventId,
) {
  return (
    executions.find(
      (item) =>
        item.evento_id ===
        eventId,
    ) ||
    null
  );
}


function getScaleForEvent(
  eventId,
) {
  return scales.filter(
    (item) =>
      item.evento_id ===
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


function getPhotosForExecution(
  executionId,
) {
  if (!executionId) {
    return [];
  }


  return executionPhotos
    .filter(
      (item) =>
        item.execucao_id ===
        executionId,
    )
    .sort(
      (a, b) =>
        a.ordem -
        b.ordem,
    );
}


function getExecutionState(
  event,
) {
  if (
    event.status ===
    "cancelada"
  ) {
    return "cancelada";
  }


  const execution =
    getExecutionForEvent(
      event.id,
    );


  if (
    execution?.status ===
      "finalizada"

    ||
    event.status ===
      "realizada"
  ) {
    return "realizada";
  }


  if (execution) {
    return "rascunho";
  }


  return "pendente";
}


function setPageMessage(
  elements,
  message = "",
  state = "",
) {
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
  elements.status.textContent =
    message;


  elements.status.dataset.state =
    state;
}


/* =========================================================
   DADOS
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
      );


  if (error) {
    throw error;
  }


  regionals =
    data ||
    [];
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
      );


  if (error) {
    throw error;
  }


  schools =
    data ||
    [];
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
      );


  if (error) {
    throw error;
  }


  instructors =
    data ||
    [];
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
      );


  if (error) {
    throw error;
  }


  events =
    data ||
    [];
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
    data ||
    [];
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
        status,
        finalizada_at,
        created_at,
        updated_at
      `);


  if (error) {
    throw error;
  }


  executions =
    data ||
    [];
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
    data ||
    [];
}


async function loadExecutionPhotos() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "execucao_fotos",
      )
      .select(`
        id,
        execucao_id,
        nome_original,
        nome_arquivo,
        mime_type,
        tamanho_bytes,
        ordem,
        legenda,
        folder_path,
        created_at
      `)
      .order(
        "ordem",
      );


  if (error) {
    throw error;
  }


  executionPhotos =
    data ||
    [];
}


async function reloadOperationalData() {
  await Promise.all([
    loadEvents(),
    loadExecutions(),
    loadExecutionInstructors(),
    loadExecutionPhotos(),
  ]);
}


/* =========================================================
   FILTRO REGIONAL
========================================================= */

function populateRegionalFilter(
  elements,
) {
  const previous =
    elements.regionalFilter
      .value;


  elements.regionalFilter
    .replaceChildren();


  const all =
    document.createElement(
      "option",
    );


  all.value =
    "all";


  all.textContent =
    "Todas";


  elements.regionalFilter
    .append(
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


      elements.regionalFilter
        .append(
          option,
        );
    },
  );


  if (
    Array.from(
      elements.regionalFilter
        .options,
    ).some(
      (option) =>
        option.value ===
        previous,
    )
  ) {
    elements.regionalFilter.value =
      previous;
  }
}


/* =========================================================
   RESUMO
========================================================= */

function renderSummary(
  elements,
) {
  const states =
    events.map(
      (event) => ({
        event,

        state:
          getExecutionState(
            event,
          ),
      }),
    );


  const pending =
    states.filter(
      (item) =>
        item.state ===
        "pendente",
    ).length;


  const drafts =
    states.filter(
      (item) =>
        item.state ===
        "rascunho",
    ).length;


  const completed =
    states.filter(
      (item) =>
        item.state ===
        "realizada",
    ).length;


  const withoutEvidence =
    executions.filter(
      (execution) =>
        getPhotosForExecution(
          execution.id,
        ).length ===
        0,
    ).length;


  const participants =
    executions.reduce(
      (
        total,
        execution,
      ) =>
        total +
        (
          execution.participantes_reais ||
          0
        ),

      0,
    );


  elements.pending.textContent =
    String(
      pending,
    );


  elements.drafts.textContent =
    String(
      drafts,
    );


  elements.completed.textContent =
    String(
      completed,
    );


  elements.withoutEvidence.textContent =
    String(
      withoutEvidence,
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


  const state =
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
            "all"

          ||
          event.regional_id ===
            regionalId
        )

        && (
          type ===
            "all"

          ||
          event.tipo_evento ===
            type
        )

        && (
          state ===
            "all"

          ||
          getExecutionState(
            event,
          ) ===
            state
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
   TABELA
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
    `${formatTime(event.hora_inicio)}–${formatTime(event.hora_fim)}`;


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


  cell.textContent =
    regional?.nome ||
    "—";


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
    cell.textContent =
      "—";


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
    `${formatTime(execution.hora_inicio_real)}–${formatTime(execution.hora_fim_real)}`;


  const photoTotal =
    getPhotosForExecution(
      execution.id,
    ).length;


  const photos =
    document.createElement(
      "small",
    );


  photos.className =
    photoTotal > 0
      ? "executions-photo-indicator"
      : "executions-photo-indicator executions-photo-indicator-empty";


  photos.textContent =
    photoTotal === 1
      ? "1 foto"
      : `${photoTotal} fotos`;


  wrapper.append(
    date,
    time,
    photos,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


function createStateCell(
  event,
) {
  const cell =
    document.createElement(
      "td",
    );


  const state =
    getExecutionState(
      event,
    );


  const labels = {
    pendente:
      "Pendente",

    rascunho:
      "Rascunho",

    realizada:
      "Realizado",

    cancelada:
      "Cancelado",
  };


  const badge =
    document.createElement(
      "span",
    );


  badge.className =
    `executions-status executions-status-${state}`;


  badge.textContent =
    labels[state] ||
    state;


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


  if (
    event.status ===
    "cancelada"
  ) {
    cell.textContent =
      "—";


    return cell;
  }


  const execution =
    getExecutionForEvent(
      event.id,
    );


  const button =
    document.createElement(
      "button",
    );


  button.type =
    "button";


  button.className =
    "btn btn-ghost";


  if (
    execution?.status ===
    "finalizada"
  ) {
    button.textContent =
      "Editar execução";

  } else if (
    execution
  ) {
    button.textContent =
      "Continuar execução";

  } else {

    button.textContent =
      "Registrar execução";
  }


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

        createStateCell(
          event,
        ),

        createActionsCell(
          event,
          elements,
        ),
      );


      elements.tableBody
        .append(
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
   INSTRUTORES
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


  elements.selectedCount
    .textContent =
      count === 1
        ? "1 presente"
        : `${count} presentes`;
}


function updateInstructorTimeFields(
  card,
) {
  const checkbox =
    card.querySelector(
      "input[data-execution-instructor]",
    );


  card
    .querySelectorAll(
      "input[type='time']",
    )
    .forEach(
      (input) => {
        input.disabled =
          !checkbox.checked;
      },
    );
}


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
    !eventScale.length
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


    const text =
      document.createElement(
        "span",
      );


    text.textContent =
      "A execução poderá ser registrada sem horas de instrutores.";


    empty.append(
      title,
      text,
    );


    elements.instructorList
      .append(
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


      checkbox.dataset
        .executionInstructor =
          instructor.id;


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


      const startInput =
        document.createElement(
          "input",
        );


      startInput.type =
        "time";


      startInput.dataset
        .executionInstructorStart =
          instructor.id;


      startInput.value =
        formatTime(
          previousItem
            ?.hora_inicio_real ||
          execution
            ?.hora_inicio_real ||
          event.hora_inicio,
        );


      startField.append(
        startInput,
      );


      const endField =
        document.createElement(
          "label",
        );


      endField.textContent =
        "Saída";


      const endInput =
        document.createElement(
          "input",
        );


      endInput.type =
        "time";


      endInput.dataset
        .executionInstructorEnd =
          instructor.id;


      endInput.value =
        formatTime(
          previousItem
            ?.hora_fim_real ||
          execution
            ?.hora_fim_real ||
          event.hora_fim,
        );


      endField.append(
        endInput,
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


      elements.instructorList
        .append(
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
   EDGE FUNCTION
========================================================= */

async function getFunctionErrorMessage(
  error,
) {
  if (
    error?.context instanceof
    Response
  ) {

    try {

      const response =
        error.context.clone();


      const data =
        await response.json();


      if (
        data?.error
      ) {
        return data.error;
      }


      if (
        data?.message
      ) {
        return data.message;
      }

    } catch {
      // continua
    }
  }


  return (
    error?.message ||
    "Não foi possível comunicar com o serviço de evidências."
  );
}


async function invokeEvidenceFunction(
  options = {},
) {
  const {
    data,
    error,
    response,
  } =
    await supabase.functions
      .invoke(
        "evidencia-foto",
        options,
      );


  if (error) {
    throw new Error(
      await getFunctionErrorMessage(
        error,
      ),
    );
  }


  return {
    data,
    response,
  };
}


/* =========================================================
   COMPRESSÃO DA FOTO
========================================================= */

function canvasToBlob(
  canvas,
  quality,
) {
  return new Promise(
    (
      resolve,
      reject,
    ) => {

      canvas.toBlob(
        (blob) => {

          if (!blob) {
            reject(
              new Error(
                "Não foi possível processar a imagem.",
              ),
            );


            return;
          }


          resolve(
            blob,
          );
        },

        "image/jpeg",

        quality,
      );
    },
  );
}


async function decodeImage(
  file,
) {
  if (
    "createImageBitmap"
    in window
  ) {

    try {

      const bitmap =
        await createImageBitmap(
          file,
          {
            imageOrientation:
              "from-image",
          },
        );


      return {
        source:
          bitmap,

        width:
          bitmap.width,

        height:
          bitmap.height,

        close() {
          bitmap.close();
        },
      };

    } catch {
      // fallback
    }
  }


  const url =
    URL.createObjectURL(
      file,
    );


  const image =
    new Image();


  await new Promise(
    (
      resolve,
      reject,
    ) => {

      image.onload =
        resolve;


      image.onerror =
        () =>
          reject(
            new Error(
              "Este formato de imagem não pôde ser processado.",
            ),
          );


      image.src =
        url;
    },
  );


  return {
    source:
      image,

    width:
      image.naturalWidth,

    height:
      image.naturalHeight,

    close() {
      URL.revokeObjectURL(
        url,
      );
    },
  };
}


async function compressImage(
  originalFile,
) {
  if (
    originalFile.size >
    MAX_ORIGINAL_FILE_SIZE
  ) {
    throw new Error(
      `"${originalFile.name}" ultrapassa o limite de 25 MB para processamento.`,
    );
  }


  const decoded =
    await decodeImage(
      originalFile,
    );


  try {

    let maxDimension =
      MAX_IMAGE_DIMENSION;


    let quality =
      0.84;


    let finalBlob =
      null;


    for (
      let attempt = 0;
      attempt < 5;
      attempt += 1
    ) {

      const ratio =
        Math.min(
          1,

          maxDimension /
            Math.max(
              decoded.width,
              decoded.height,
            ),
        );


      const width =
        Math.max(
          1,

          Math.round(
            decoded.width *
            ratio,
          ),
        );


      const height =
        Math.max(
          1,

          Math.round(
            decoded.height *
            ratio,
          ),
        );


      const canvas =
        document.createElement(
          "canvas",
        );


      canvas.width =
        width;


      canvas.height =
        height;


      const context =
        canvas.getContext(
          "2d",
        );


      if (!context) {
        throw new Error(
          "O navegador não conseguiu preparar a imagem.",
        );
      }


      context.fillStyle =
        "#ffffff";


      context.fillRect(
        0,
        0,
        width,
        height,
      );


      context.drawImage(
        decoded.source,
        0,
        0,
        width,
        height,
      );


      finalBlob =
        await canvasToBlob(
          canvas,
          quality,
        );


      if (
        finalBlob.size <=
        TARGET_UPLOAD_SIZE
      ) {
        break;
      }


      maxDimension =
        Math.max(
          1100,

          Math.round(
            maxDimension *
            0.82,
          ),
        );


      quality =
        Math.max(
          0.58,

          quality -
          0.08,
        );
    }


    if (
      !finalBlob ||
      finalBlob.size >
      5 * 1024 * 1024
    ) {
      throw new Error(
        `Não foi possível reduzir "${originalFile.name}" para o tamanho permitido.`,
      );
    }


    const baseName =
      originalFile.name
        .replace(
          /\.[^.]+$/,
          "",
        )
        .replace(
          /[^\p{L}\p{N}\-_ ]/gu,
          "",
        )
        .trim() ||
      "foto";


    return new File(
      [
        finalBlob,
      ],

      `${baseName}.jpg`,

      {
        type:
          "image/jpeg",

        lastModified:
          Date.now(),
      },
    );

  } finally {

    decoded.close();
  }
}


/* =========================================================
   OBJECT URLS
========================================================= */

function cleanupPreviewUrls() {
  previewObjectUrls
    .forEach(
      (url) => {
        URL.revokeObjectURL(
          url,
        );
      },
    );


  previewObjectUrls =
    [];
}


/* =========================================================
   DOWNLOAD PRIVADO
========================================================= */

async function loadPrivatePhotoBlob(
  photo,
) {
  const {
    data,
  } =
    await invokeEvidenceFunction({
      body: {
        action:
          "download",

        foto_id:
          photo.id,
      },
    });


  if (
    !(data instanceof Blob)
  ) {
    throw new Error(
      "A evidência não foi retornada como imagem.",
    );
  }


  return new Blob(
    [
      data,
    ],
    {
      type:
        photo.mime_type ||
        "image/jpeg",
    },
  );
}


/* =========================================================
   CONTADOR DAS FOTOS
========================================================= */

function getCurrentExecutionPhotoCount() {
  const execution =
    getExecutionForEvent(
      selectedEventId,
    );


  return (
    getPhotosForExecution(
      execution?.id,
    ).length +
    pendingPhotos.length
  );
}


/* =========================================================
   REMOVER FOTO PENDENTE
========================================================= */

async function removePendingPhoto(
  pendingId,
  elements,
) {
  pendingPhotos =
    pendingPhotos.filter(
      (item) =>
        item.id !==
        pendingId,
    );


  await renderPhotoEvidence(
    elements,
  );
}


/* =========================================================
   REMOVER FOTO SALVA
========================================================= */

async function removeStoredPhoto(
  photo,
  elements,
) {
  const confirmed =
    window.confirm(
      "Deseja remover esta foto de evidência?",
    );


  if (!confirmed) {
    return;
  }


  try {

    setDialogStatus(
      elements,
      "Removendo foto...",
      "loading",
    );


    await invokeEvidenceFunction({
      method:
        "DELETE",

      body: {
        foto_id:
          photo.id,
      },
    });


    await loadExecutionPhotos();


    await renderPhotoEvidence(
      elements,
    );


    render(
      elements,
    );


    setDialogStatus(
      elements,
      "Foto removida com sucesso.",
      "success",
    );

  } catch (
    error
  ) {

    setDialogStatus(
      elements,
      error.message,
      "error",
    );
  }
}


/* =========================================================
   CARD
========================================================= */

function createPhotoCardBase(
  titleText,
) {
  const card =
    document.createElement(
      "article",
    );


  card.className =
    "executions-photo-card";


  const preview =
    document.createElement(
      "div",
    );


  preview.className =
    "executions-photo-preview";


  const title =
    document.createElement(
      "strong",
    );


  title.className =
    "executions-photo-title";


  title.textContent =
    titleText;


  card.append(
    preview,
    title,
  );


  return {
    card,
    preview,
  };
}


/* =========================================================
   RENDER FOTOS
========================================================= */

async function renderPhotoEvidence(
  elements,
) {
  const version =
    ++photoRenderVersion;


  cleanupPreviewUrls();


  const execution =
    getExecutionForEvent(
      selectedEventId,
    );


  const storedPhotos =
    getPhotosForExecution(
      execution?.id,
    );


  elements.photoGrid
    .replaceChildren();


  const total =
    storedPhotos.length +
    pendingPhotos.length;


  elements.photoCount.textContent =
    `${total} de ${MAX_PHOTOS}`;


  elements.photoEmpty.hidden =
    total >
    0;


  elements.addPhotosButton.disabled =
    total >=
    MAX_PHOTOS;


  /* =======================================================
     FOTOS SALVAS
  ======================================================= */

  storedPhotos.forEach(
    (photo) => {

      const {
        card,
        preview,
      } =
        createPhotoCardBase(
          `Foto ${photo.ordem}`,
        );


      const loading =
        document.createElement(
          "span",
        );


      loading.className =
        "executions-photo-loading";


      loading.textContent =
        "Carregando...";


      preview.append(
        loading,
      );


      const caption =
        document.createElement(
          "input",
        );


      caption.type =
        "text";


      caption.maxLength =
        300;


      caption.placeholder =
        "Legenda opcional";


      caption.value =
        photo.legenda ||
        "";


      caption.addEventListener(
        "input",
        () => {
          photo.legenda =
            caption.value;
        },
      );


      caption.addEventListener(
        "change",
        async () => {

          const {
            error,
          } =
            await supabase.rpc(
              "update_execution_photo_caption",
              {
                p_foto_id:
                  photo.id,

                p_legenda:
                  caption.value
                    .trim() ||
                  null,
              },
            );


          if (error) {

            setDialogStatus(
              elements,
              "Não foi possível salvar a legenda.",
              "error",
            );

          } else {

            setDialogStatus(
              elements,
              "Legenda salva.",
              "success",
            );
          }
        },
      );


      const remove =
        document.createElement(
          "button",
        );


      remove.type =
        "button";


      remove.className =
        "executions-photo-remove";


      remove.textContent =
        "Remover";


      remove.addEventListener(
        "click",
        async () => {

          await removeStoredPhoto(
            photo,
            elements,
          );
        },
      );


      card.append(
        caption,
        remove,
      );


      elements.photoGrid
        .append(
          card,
        );


      /*
       * Carregamento privado assíncrono.
       */
      (async () => {

        try {

          const blob =
            await loadPrivatePhotoBlob(
              photo,
            );


          const objectUrl =
            URL.createObjectURL(
              blob,
            );


          if (
            version !==
            photoRenderVersion
          ) {

            URL.revokeObjectURL(
              objectUrl,
            );


            return;
          }


          previewObjectUrls.push(
            objectUrl,
          );


          const image =
            document.createElement(
              "img",
            );


          image.src =
            objectUrl;


          image.alt =
            photo.legenda ||
            `Evidência ${photo.ordem}`;


          preview.replaceChildren(
            image,
          );

        } catch (
          error
        ) {

          console.error(
            "[YXZ] Não foi possível carregar preview:",
            error,
          );


          if (
            version ===
            photoRenderVersion
          ) {
            preview.textContent =
              "Não foi possível carregar.";
          }
        }
      })();
    },
  );


  /* =======================================================
     FOTOS PENDENTES
  ======================================================= */

  pendingPhotos.forEach(
    (
      photo,
      index,
    ) => {

      const {
        card,
        preview,
      } =
        createPhotoCardBase(
          `Nova foto ${storedPhotos.length + index + 1}`,
        );


      card.classList.add(
        "executions-photo-card-pending",
      );


      const objectUrl =
        URL.createObjectURL(
          photo.file,
        );


      previewObjectUrls.push(
        objectUrl,
      );


      const image =
        document.createElement(
          "img",
        );


      image.src =
        objectUrl;


      image.alt =
        "Nova evidência fotográfica";


      preview.append(
        image,
      );


      const badge =
        document.createElement(
          "span",
        );


      badge.className =
        "executions-photo-pending-badge";


      badge.textContent =
        "Aguardando envio";


      const caption =
        document.createElement(
          "input",
        );


      caption.type =
        "text";


      caption.maxLength =
        300;


      caption.placeholder =
        "Legenda opcional";


      caption.value =
        photo.legenda;


      caption.addEventListener(
        "input",
        () => {
          photo.legenda =
            caption.value;
        },
      );


      const remove =
        document.createElement(
          "button",
        );


      remove.type =
        "button";


      remove.className =
        "executions-photo-remove";


      remove.textContent =
        "Remover";


      remove.addEventListener(
        "click",
        async () => {

          await removePendingPhoto(
            photo.id,
            elements,
          );
        },
      );


      card.append(
        badge,
        caption,
        remove,
      );


      elements.photoGrid
        .append(
          card,
        );
    },
  );
}


/* =========================================================
   SELEÇÃO DE ARQUIVOS
========================================================= */

async function handlePhotoSelection(
  fileList,
  elements,
) {
  const files =
    Array.from(
      fileList ||
      [],
    );


  if (!files.length) {
    return;
  }


  const available =
    MAX_PHOTOS -
    getCurrentExecutionPhotoCount();


  if (
    available <= 0
  ) {

    setDialogStatus(
      elements,
      "O limite de 6 fotos já foi atingido.",
      "error",
    );


    return;
  }


  const selected =
    files.slice(
      0,
      available,
    );


  try {

    for (
      let index = 0;
      index < selected.length;
      index += 1
    ) {

      const original =
        selected[index];


      setDialogStatus(
        elements,
        `Preparando foto ${index + 1} de ${selected.length}...`,
        "loading",
      );


      const compressed =
        await compressImage(
          original,
        );


      pendingPhotos.push({
        id:
          crypto.randomUUID(),

        originalName:
          original.name,

        file:
          compressed,

        legenda:
          "",
      });
    }


    await renderPhotoEvidence(
      elements,
    );


    const ignored =
      files.length -
      selected.length;


    if (
      ignored >
      0
    ) {

      setDialogStatus(
        elements,
        `${ignored} arquivo(s) não foram incluídos porque o limite é de 6 fotos.`,
        "info",
      );

    } else {

      setDialogStatus(
        elements,
        "Fotos preparadas para envio.",
        "success",
      );
    }

  } catch (
    error
  ) {

    setDialogStatus(
      elements,
      error.message ||
      "Não foi possível processar uma das imagens.",
      "error",
    );

  } finally {

    elements.photoInput.value =
      "";
  }
}


/* =========================================================
   INSTRUTORES SELECIONADOS
========================================================= */

function getSelectedExecutionInstructors(
  elements,
) {
  const result =
    [];


  const checkboxes =
    elements.instructorList
      .querySelectorAll(
        "input[data-execution-instructor]:checked",
      );


  checkboxes.forEach(
    (checkbox) => {

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


      result.push({
        instrutor_id:
          instructorId,

        hora_inicio_real:
          start,

        hora_fim_real:
          end,
      });
    },
  );


  return result;
}


/* =========================================================
   VALIDAR FORMULÁRIO
========================================================= */

function collectExecutionPayload(
  elements,
) {
  const event =
    getEventById(
      selectedEventId,
    );


  if (!event) {
    throw new Error(
      "Evento não encontrado.",
    );
  }


  const realDate =
    elements.realDate.value;


  const start =
    elements.startTime.value;


  const end =
    elements.endTime.value;


  if (!realDate) {
    throw new Error(
      "Informe a data realizada.",
    );
  }


  if (
    !start ||
    !end
  ) {
    throw new Error(
      "Informe o horário realizado.",
    );
  }


  if (
    end <=
    start
  ) {
    throw new Error(
      "O horário final precisa ser posterior ao horário inicial.",
    );
  }


  const participantText =
    elements.participantsInput
      .value
      .trim();


  const participants =
    participantText
      ? Number(
          participantText,
        )
      : null;


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
    throw new Error(
      "Informe uma quantidade válida de participantes.",
    );
  }


  const selectedInstructors =
    getSelectedExecutionInstructors(
      elements,
    );


  selectedInstructors.forEach(
    (item) => {

      const instructor =
        getInstructorById(
          item.instrutor_id,
        );


      if (
        !item.hora_inicio_real ||
        !item.hora_fim_real
      ) {
        throw new Error(
          `Informe os horários de "${instructor?.nome || "instrutor"}".`,
        );
      }


      if (
        item.hora_fim_real <=
        item.hora_inicio_real
      ) {
        throw new Error(
          `O horário de "${instructor?.nome || "instrutor"}" é inválido.`,
        );
      }


      if (
        item.hora_inicio_real <
          start

        ||
        item.hora_fim_real >
          end
      ) {
        throw new Error(
          `O horário de "${instructor?.nome || "instrutor"}" precisa estar dentro do horário real do evento.`,
        );
      }
    },
  );


  return {
    event,

    realDate,

    start,

    end,

    participants,

    notes:
      elements.notes.value
        .trim() ||
      null,

    selectedInstructors,
  };
}


/* =========================================================
   SALVAR DADOS DA EXECUÇÃO
========================================================= */

async function saveExecutionData(
  payload,
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "register_event_execution",
      {
        p_evento_id:
          payload.event.id,

        p_data_real:
          payload.realDate,

        p_hora_inicio_real:
          payload.start,

        p_hora_fim_real:
          payload.end,

        p_participantes_reais:
          payload.participants,

        p_observacoes:
          payload.notes,

        p_instrutores:
          payload.selectedInstructors,
      },
    );


  if (error) {
    throw error;
  }


  return data;
}


/* =========================================================
   SALVAR LEGENDAS
========================================================= */

async function saveExistingCaptions(
  executionId,
) {
  const photos =
    getPhotosForExecution(
      executionId,
    );


  for (
    const photo
    of photos
  ) {

    const {
      error,
    } =
      await supabase.rpc(
        "update_execution_photo_caption",
        {
          p_foto_id:
            photo.id,

          p_legenda:
            photo.legenda
              ?.trim() ||
            null,
        },
      );


    if (error) {
      throw error;
    }
  }
}


/* =========================================================
   SINCRONIZAR PASTA
========================================================= */

async function syncExistingPhotoFolder(
  executionId,
) {
  if (
    getPhotosForExecution(
      executionId,
    ).length ===
    0
  ) {
    return;
  }


  await invokeEvidenceFunction({
    body: {
      action:
        "sync-folder",

      execucao_id:
        executionId,
    },
  });
}


/* =========================================================
   UPLOAD DA FILA
========================================================= */

async function uploadPendingPhotos(
  executionId,
  elements,
) {
  const queue =
    [
      ...pendingPhotos,
    ];


  let current =
    0;


  try {

    for (
      const photo
      of queue
    ) {

      current +=
        1;


      setDialogStatus(
        elements,
        `Enviando foto ${current} de ${queue.length}...`,
        "loading",
      );


      const formData =
        new FormData();


      formData.append(
        "execucao_id",
        executionId,
      );


      formData.append(
        "legenda",
        photo.legenda ||
        "",
      );


      formData.append(
        "nome_original",
        photo.originalName,
      );


      formData.append(
        "file",
        photo.file,
      );


      await invokeEvidenceFunction({
        body:
          formData,
      });


      pendingPhotos =
        pendingPhotos.filter(
          (item) =>
            item.id !==
            photo.id,
        );
    }

  } catch (
    error
  ) {

    await loadExecutionPhotos();


    await renderPhotoEvidence(
      elements,
    );


    throw error;
  }


  await loadExecutionPhotos();
}


/* =========================================================
   SALVAR / FINALIZAR
========================================================= */

async function persistExecution(
  elements,
  {
    finalize = false,
  } = {},
) {
  let payload;


  try {

    payload =
      collectExecutionPayload(
        elements,
      );

  } catch (
    error
  ) {

    setDialogStatus(
      elements,
      error.message,
      "error",
    );


    return;
  }


  elements.save.disabled =
    true;


  elements.saveDraft.disabled =
    true;


  elements.addPhotosButton.disabled =
    true;


  try {

    setDialogStatus(
      elements,
      "Salvando dados da execução...",
      "loading",
    );


    /* =====================================================
       1. SALVAR DADOS
    ===================================================== */

    const executionId =
      await saveExecutionData(
        payload,
      );


    /* =====================================================
       2. LEGENDAS
    ===================================================== */

    await saveExistingCaptions(
      executionId,
    );


    /* =====================================================
       3. REORGANIZAR FOTOS ANTIGAS SE DATA MUDOU
    ===================================================== */

    await syncExistingPhotoFolder(
      executionId,
    );


    /* =====================================================
       4. UPLOAD NOVAS FOTOS
    ===================================================== */

    await uploadPendingPhotos(
      executionId,
      elements,
    );


    /* =====================================================
       5. RECARREGAR
    ===================================================== */

    await Promise.all([
      loadExecutions(),
      loadExecutionInstructors(),
      loadExecutionPhotos(),
    ]);


    /* =====================================================
       RASCUNHO
    ===================================================== */

    if (!finalize) {

      await loadEvents();


      render(
        elements,
      );


      closeExecutionDialog(
        elements,
      );


      setPageMessage(
        elements,
        "Rascunho salvo com sucesso.",
        "success",
      );


      return;
    }


    /* =====================================================
       EVIDÊNCIA OBRIGATÓRIA
    ===================================================== */

    const photoCount =
      getPhotosForExecution(
        executionId,
      ).length;


    if (
      photoCount <
      1
    ) {

      await renderPhotoEvidence(
        elements,
      );


      render(
        elements,
      );


      setDialogStatus(
        elements,
        "Os dados foram salvos como rascunho. Adicione pelo menos uma foto para concluir a execução.",
        "error",
      );


      return;
    }


    /* =====================================================
       FINALIZAR
    ===================================================== */

    setDialogStatus(
      elements,
      "Finalizando execução...",
      "loading",
    );


    const {
      error: finalizeError,
    } =
      await supabase.rpc(
        "finalize_event_execution",
        {
          p_evento_id:
            payload.event.id,
        },
      );


    if (
      finalizeError
    ) {
      throw finalizeError;
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
      "Execução concluída com sucesso.",
      "success",
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Erro ao salvar execução:",
      error,
    );


    setDialogStatus(
      elements,
      error?.message ||
      "Não foi possível salvar a execução.",
      "error",
    );

  } finally {

    elements.save.disabled =
      false;


    elements.saveDraft.disabled =
      false;


    elements.addPhotosButton.disabled =
      getCurrentExecutionPhotoCount() >=
      MAX_PHOTOS;
  }
}


/* =========================================================
   ABRIR MODAL
========================================================= */

async function openExecutionDialog(
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


  pendingPhotos =
    [];


  cleanupPreviewUrls();


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


  const finalized =
    execution?.status ===
    "finalizada";


  elements.kicker.textContent =
    finalized
      ? "Execução finalizada"
      : execution
        ? "Rascunho existente"
        : "Evento realizado";


  elements.title.textContent =
    finalized
      ? "Editar execução"
      : execution
        ? "Continuar execução"
        : "Registrar execução";


  elements.saveDraft.hidden =
    finalized;


  elements.save.textContent =
    finalized
      ? "Salvar alterações"
      : "Concluir execução";


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
    `${formatTime(event.hora_inicio)}–${formatTime(event.hora_fim)}`;


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


  await renderPhotoEvidence(
    elements,
  );


  elements.dialog
    .showModal();
}


/* =========================================================
   FECHAR
========================================================= */

function closeExecutionDialog(
  elements,
) {
  selectedEventId =
    null;


  pendingPhotos =
    [];


  photoRenderVersion +=
    1;


  cleanupPreviewUrls();


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
   EVENTOS DA INTERFACE
========================================================= */

function bindEvents(
  elements,
) {
  elements.search
    .addEventListener(
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

      element.addEventListener(
        "change",
        () => {

          renderTable(
            elements,
          );
        },
      );
    },
  );


  elements.addPhotosButton
    .addEventListener(
      "click",
      () => {

        elements.photoInput
          .click();
      },
    );


  elements.photoInput
    .addEventListener(
      "change",
      async () => {

        await handlePhotoSelection(
          elements.photoInput.files,
          elements,
        );
      },
    );


  elements.saveDraft
    .addEventListener(
      "click",
      async () => {

        await persistExecution(
          elements,
          {
            finalize:
              false,
          },
        );
      },
    );


  elements.form
    .addEventListener(
      "submit",
      async (
        event,
      ) => {

        event.preventDefault();


        await persistExecution(
          elements,
          {
            finalize:
              true,
          },
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
    .addEventListener(
      "click",
      (
        event,
      ) => {

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


  elements.dialog
    .addEventListener(
      "cancel",
      (
        event,
      ) => {

        event.preventDefault();


        closeExecutionDialog(
          elements,
        );
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
      loadExecutionPhotos(),
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

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Não foi possível carregar Execuções:",
      error,
    );


    elements.tableBody
      .replaceChildren();


    setPageMessage(
      elements,
      "Não foi possível carregar o módulo de Execuções.",
      "error",
    );
  }
}