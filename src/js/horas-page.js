import {
  supabase,
} from "./supabase.js";


const EVENT_TYPES = {
  oficina_educacional:
    "Oficina Educacional",

  evento_comunidade:
    "Evento à Comunidade",
};


let regionals = [];
let instructors = [];
let hourRows = [];


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-hours-message]",
      ),

    month:
      document.querySelector(
        "[data-hours-month]",
      ),

    regional:
      document.querySelector(
        "[data-hours-regional]",
      ),

    instructor:
      document.querySelector(
        "[data-hours-instructor]",
      ),

    type:
      document.querySelector(
        "[data-hours-type]",
      ),

    search:
      document.querySelector(
        "[data-hours-search]",
      ),

    total:
      document.querySelector(
        "[data-hours-total]",
      ),

    participations:
      document.querySelector(
        "[data-hours-participations]",
      ),

    instructors:
      document.querySelector(
        "[data-hours-instructors]",
      ),

    events:
      document.querySelector(
        "[data-hours-events]",
      ),

    periodLabel:
      document.querySelector(
        "[data-hours-period-label]",
      ),

    tableBody:
      document.querySelector(
        "[data-hours-table-body]",
      ),

    empty:
      document.querySelector(
        "[data-hours-empty]",
      ),

    export:
      document.querySelector(
        "[data-hours-export]",
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
  if (
    !value
  ) {
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


function formatMinutes(
  totalMinutes,
) {
  const minutes =
    Number(
      totalMinutes ||
      0,
    );


  const hours =
    Math.floor(
      minutes /
      60,
    );


  const remaining =
    minutes %
    60;


  if (
    hours ===
      0
  ) {
    return `${remaining}min`;
  }


  if (
    remaining ===
      0
  ) {
    return `${hours}h`;
  }


  return `${hours}h ${remaining}min`;
}


function formatDecimalHours(
  totalMinutes,
) {
  return (
    Number(
      totalMinutes ||
      0,
    )
    /
    60
  )
    .toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      },
    );
}


function getCurrentMonthValue() {
  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() +
      1,
    ).padStart(
      2,
      "0",
    );


  return `${year}-${month}`;
}


function getMonthPeriod(
  monthValue,
) {
  const [
    yearText,
    monthText,
  ] =
    String(
      monthValue ||
      "",
    ).split(
      "-",
    );


  const year =
    Number(
      yearText,
    );


  const month =
    Number(
      monthText,
    );


  if (
    !year ||
    !month ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      "Selecione uma competência válida.",
    );
  }


  const lastDay =
    new Date(
      year,
      month,
      0,
    ).getDate();


  return {
    start:
      `${yearText}-${monthText}-01`,

    end:
      `${yearText}-${monthText}-${String(lastDay).padStart(2, "0")}`,
  };
}


function getMonthLabel(
  monthValue,
) {
  const [
    year,
    month,
  ] =
    String(
      monthValue ||
      "",
    ).split(
      "-",
    );


  if (
    !year ||
    !month
  ) {
    return "—";
  }


  const date =
    new Date(
      Number(
        year,
      ),

      Number(
        month,
      ) -
      1,

      1,
    );


  const label =
    date.toLocaleDateString(
      "pt-BR",
      {
        month:
          "long",

        year:
          "numeric",
      },
    );


  return (
    label.charAt(
      0,
    ).toUpperCase()
    +
    label.slice(
      1,
    )
  );
}


function setMessage(
  elements,
  message = "",
  state = "",
) {
  elements.message.textContent =
    message;


  elements.message.dataset.state =
    state;
}


/* =========================================================
   REGIONAIS
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


  if (
    error
  ) {
    throw error;
  }


  regionals =
    data ||
    [];
}


/* =========================================================
   INSTRUTORES
========================================================= */

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
        ativo
      `)
      .order(
        "nome",
        {
          ascending:
            true,
        },
      );


  if (
    error
  ) {
    throw error;
  }


  instructors =
    data ||
    [];
}


/* =========================================================
   SELECTS
========================================================= */

function populateRegionals(
  elements,
) {
  const previous =
    elements.regional.value;


  elements.regional
    .replaceChildren();


  const all =
    document.createElement(
      "option",
    );


  all.value =
    "";


  all.textContent =
    "Todas";


  elements.regional.append(
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


      elements.regional.append(
        option,
      );
    },
  );


  if (
    Array.from(
      elements.regional.options,
    ).some(
      (option) =>
        option.value ===
        previous,
    )
  ) {
    elements.regional.value =
      previous;
  }
}


function populateInstructors(
  elements,
) {
  const previous =
    elements.instructor.value;


  elements.instructor
    .replaceChildren();


  const all =
    document.createElement(
      "option",
    );


  all.value =
    "";


  all.textContent =
    "Todos";


  elements.instructor.append(
    all,
  );


  instructors.forEach(
    (instructor) => {

      const option =
        document.createElement(
          "option",
        );


      option.value =
        instructor.id;


      option.textContent =
        instructor.ativo
          ? instructor.nome
          : `${instructor.nome} (inativo)`;


      elements.instructor.append(
        option,
      );
    },
  );


  if (
    Array.from(
      elements.instructor.options,
    ).some(
      (option) =>
        option.value ===
        previous,
    )
  ) {
    elements.instructor.value =
      previous;
  }
}


/* =========================================================
   CARREGAR HORAS
========================================================= */

async function loadHours(
  elements,
) {
  const period =
    getMonthPeriod(
      elements.month.value,
    );


  const regionalId =
    elements.regional.value ||
    null;


  const instructorId =
    elements.instructor.value ||
    null;


  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_instructor_hours",
      {
        p_data_inicial:
          period.start,

        p_data_final:
          period.end,

        p_regional_id:
          regionalId,

        p_instrutor_id:
          instructorId,
      },
    );


  if (
    error
  ) {
    throw error;
  }


  hourRows =
    data ||
    [];
}


/* =========================================================
   FILTRO LOCAL
========================================================= */

function getFilteredRows(
  elements,
) {
  const search =
    normalizeText(
      elements.search.value,
    );


  const eventType =
    elements.type.value;


  return hourRows.filter(
    (row) => {

      const searchable =
        normalizeText(
          [
            row.instrutor_nome,
            row.atividade,
            row.escola_nome,
            row.regional_nome,
            EVENT_TYPES[
              row.tipo_evento
            ],
          ].join(
            " ",
          ),
        );


      return (
        (
          !eventType

          ||
          row.tipo_evento ===
            eventType
        )

        && (
          !search

          ||
          searchable.includes(
            search,
          )
        )
      );
    },
  );
}


/* =========================================================
   RESUMO
========================================================= */

function renderSummary(
  elements,
  rows,
) {
  const totalMinutes =
    rows.reduce(
      (
        total,
        row,
      ) =>
        total +
        Number(
          row.minutos_trabalhados ||
          0,
        ),

      0,
    );


  const instructorIds =
    new Set(
      rows.map(
        (row) =>
          row.instrutor_id,
      ),
    );


  const eventIds =
    new Set(
      rows.map(
        (row) =>
          row.evento_id,
      ),
    );


  elements.total.textContent =
    formatMinutes(
      totalMinutes,
    );


  elements.total.title =
    `${formatDecimalHours(totalMinutes)} horas`;


  elements.participations.textContent =
    String(
      rows.length,
    );


  elements.instructors.textContent =
    String(
      instructorIds.size,
    );


  elements.events.textContent =
    String(
      eventIds.size,
    );
}


/* =========================================================
   CÉLULA DATA
========================================================= */

function createDateCell(
  row,
) {
  const cell =
    document.createElement(
      "td",
    );


  const strong =
    document.createElement(
      "strong",
    );


  strong.textContent =
    formatDateBR(
      row.data_real,
    );


  cell.append(
    strong,
  );


  return cell;
}


/* =========================================================
   INSTRUTOR
========================================================= */

function createInstructorCell(
  row,
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
    "hours-instructor";


  const avatar =
    document.createElement(
      "span",
    );


  avatar.className =
    "hours-instructor-avatar";


  avatar.textContent =
    String(
      row.instrutor_nome ||
      "?",
    )
      .trim()
      .charAt(
        0,
      )
      .toUpperCase();


  const name =
    document.createElement(
      "strong",
    );


  name.textContent =
    row.instrutor_nome;


  wrapper.append(
    avatar,
    name,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


/* =========================================================
   EVENTO
========================================================= */

function createEventCell(
  row,
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
    "hours-event";


  const name =
    document.createElement(
      "strong",
    );


  name.textContent =
    row.atividade;


  const type =
    document.createElement(
      "span",
    );


  type.className =
    row.tipo_evento ===
      "evento_comunidade"
      ? "hours-type hours-type-community"
      : "hours-type hours-type-educational";


  type.textContent =
    EVENT_TYPES[
      row.tipo_evento
    ] ||
    row.tipo_evento;


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
  row,
) {
  const cell =
    document.createElement(
      "td",
    );


  cell.textContent =
    row.escola_nome;


  return cell;
}


/* =========================================================
   REGIONAL
========================================================= */

function createRegionalCell(
  row,
) {
  const cell =
    document.createElement(
      "td",
    );


  const regional =
    regionals.find(
      (item) =>
        item.id ===
        row.regional_id,
    );


  cell.className =
    "hours-regional";


  if (
    regional?.codigo
  ) {
    cell.classList.add(
      `hours-regional-${regional.codigo}`,
    );
  }


  cell.textContent =
    row.regional_nome;


  return cell;
}


/* =========================================================
   HORÁRIO
========================================================= */

function createTimeCell(
  value,
) {
  const cell =
    document.createElement(
      "td",
    );


  cell.textContent =
    formatTime(
      value,
    );


  return cell;
}


/* =========================================================
   HORAS
========================================================= */

function createHoursCell(
  row,
) {
  const cell =
    document.createElement(
      "td",
    );


  const value =
    document.createElement(
      "strong",
    );


  value.className =
    "hours-worked";


  value.textContent =
    formatMinutes(
      row.minutos_trabalhados,
    );


  value.title =
    `${formatDecimalHours(row.minutos_trabalhados)} horas`;


  cell.append(
    value,
  );


  return cell;
}


/* =========================================================
   TABELA
========================================================= */

function renderTable(
  elements,
  rows,
) {
  elements.tableBody
    .replaceChildren();


  elements.empty.hidden =
    rows.length >
    0;


  rows.forEach(
    (row) => {

      const tableRow =
        document.createElement(
          "tr",
        );


      tableRow.append(
        createDateCell(
          row,
        ),

        createInstructorCell(
          row,
        ),

        createEventCell(
          row,
        ),

        createSchoolCell(
          row,
        ),

        createRegionalCell(
          row,
        ),

        createTimeCell(
          row.hora_inicio_real,
        ),

        createTimeCell(
          row.hora_fim_real,
        ),

        createHoursCell(
          row,
        ),
      );


      elements.tableBody.append(
        tableRow,
      );
    },
  );
}


/* =========================================================
   RENDER
========================================================= */

function render(
  elements,
) {
  const rows =
    getFilteredRows(
      elements,
    );


  elements.periodLabel.textContent =
    getMonthLabel(
      elements.month.value,
    );


  renderSummary(
    elements,
    rows,
  );


  renderTable(
    elements,
    rows,
  );


  elements.export.disabled =
    rows.length ===
    0;
}


/* =========================================================
   RECARREGAR CONSULTA
========================================================= */

async function refreshHours(
  elements,
) {
  try {

    setMessage(
      elements,
      "Atualizando horas...",
      "loading",
    );


    await loadHours(
      elements,
    );


    render(
      elements,
    );


    setMessage(
      elements,
      "",
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Não foi possível carregar as horas:",
      error,
    );


    hourRows =
      [];


    render(
      elements,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar as horas dos instrutores.",
      "error",
    );
  }
}


/* =========================================================
   CSV
========================================================= */

function escapeCsvValue(
  value,
) {
  const text =
    String(
      value ??
      "",
    );


  return (
    `"${text.replace(
      /"/g,
      '""',
    )}"`
  );
}


function exportCsv(
  elements,
) {
  const rows =
    getFilteredRows(
      elements,
    );


  if (
    !rows.length
  ) {
    return;
  }


  const headers = [
    "Data",
    "Instrutor",
    "Tipo de evento",
    "Evento",
    "Escola",
    "Regional",
    "Entrada",
    "Saída",
    "Minutos",
    "Horas decimais",
  ];


  const lines = [
    headers
      .map(
        escapeCsvValue,
      )
      .join(
        ";",
      ),
  ];


  rows.forEach(
    (row) => {

      const values = [
        formatDateBR(
          row.data_real,
        ),

        row.instrutor_nome,

        EVENT_TYPES[
          row.tipo_evento
        ] ||
        row.tipo_evento,

        row.atividade,

        row.escola_nome,

        row.regional_nome,

        formatTime(
          row.hora_inicio_real,
        ),

        formatTime(
          row.hora_fim_real,
        ),

        row.minutos_trabalhados,

        formatDecimalHours(
          row.minutos_trabalhados,
        ),
      ];


      lines.push(
        values
          .map(
            escapeCsvValue,
          )
          .join(
            ";",
          ),
      );
    },
  );


  const content =
    "\uFEFF" +
    lines.join(
      "\r\n",
    );


  const blob =
    new Blob(
      [
        content,
      ],
      {
        type:
          "text/csv;charset=utf-8;",
      },
    );


  const url =
    URL.createObjectURL(
      blob,
    );


  const link =
    document.createElement(
      "a",
    );


  link.href =
    url;


  const regionalName =
    elements.regional
      .selectedOptions?.[0]
      ?.textContent
      ?.trim() ||
    "Todas";


  const safeRegional =
    normalizeText(
      regionalName,
    )
      .replace(
        /\s+/g,
        "-",
      )
      ||
    "todas";


  link.download =
    `yxz-horas-${elements.month.value}-${safeRegional}.csv`;


  document.body.append(
    link,
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url,
  );
}


/* =========================================================
   EVENTOS
========================================================= */

function bindEvents(
  elements,
) {
  elements.month.addEventListener(
    "change",
    async () => {

      await refreshHours(
        elements,
      );
    },
  );


  elements.regional.addEventListener(
    "change",
    async () => {

      await refreshHours(
        elements,
      );
    },
  );


  elements.instructor.addEventListener(
    "change",
    async () => {

      await refreshHours(
        elements,
      );
    },
  );


  elements.type.addEventListener(
    "change",
    () => {

      render(
        elements,
      );
    },
  );


  elements.search.addEventListener(
    "input",
    () => {

      render(
        elements,
      );
    },
  );


  elements.export.addEventListener(
    "click",
    () => {

      exportCsv(
        elements,
      );
    },
  );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

export async function initHorasPage() {
  const elements =
    getElements();


  elements.month.value =
    getCurrentMonthValue();


  bindEvents(
    elements,
  );


  try {

    setMessage(
      elements,
      "Carregando módulo de horas...",
      "loading",
    );


    await Promise.all([
      loadRegionals(),
      loadInstructors(),
    ]);


    populateRegionals(
      elements,
    );


    populateInstructors(
      elements,
    );


    await loadHours(
      elements,
    );


    render(
      elements,
    );


    setMessage(
      elements,
      "",
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Não foi possível iniciar Horas:",
      error,
    );


    hourRows =
      [];


    render(
      elements,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar o módulo de Horas.",
      "error",
    );
  }
}