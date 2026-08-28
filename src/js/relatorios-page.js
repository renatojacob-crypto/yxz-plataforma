import {
  supabase,
} from "./supabase.js";


const EVENT_TYPE_LABELS = {
  oficina_educacional:
    "Oficina Educacional",

  evento_comunidade:
    "Evento à Comunidade",
};


const CONFERENCE_LABELS = {
  fechada:
    "Fechada",

  aberta:
    "Aberta",

  sem_conferencia:
    "Sem conferência",
};


let regionals =
  [];

let reportRows =
  [];


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-reports-message]",
      ),

    month:
      document.querySelector(
        "[data-reports-month]",
      ),

    regional:
      document.querySelector(
        "[data-reports-regional]",
      ),

    type:
      document.querySelector(
        "[data-reports-type]",
      ),

    conference:
      document.querySelector(
        "[data-reports-conference]",
      ),

    search:
      document.querySelector(
        "[data-reports-search]",
      ),

    refresh:
      document.querySelector(
        "[data-reports-refresh]",
      ),

    export:
      document.querySelector(
        "[data-reports-export]",
      ),

    print:
      document.querySelector(
        "[data-reports-print]",
      ),

    events:
      document.querySelector(
        "[data-reports-events]",
      ),

    participants:
      document.querySelector(
        "[data-reports-participants]",
      ),

    hours:
      document.querySelector(
        "[data-reports-hours]",
      ),

    photos:
      document.querySelector(
        "[data-reports-photos]",
      ),

    averageParticipants:
      document.querySelector(
        "[data-reports-average-participants]",
      ),

    forecast:
      document.querySelector(
        "[data-reports-forecast]",
      ),

    expense:
      document.querySelector(
        "[data-reports-expense]",
      ),

    difference:
      document.querySelector(
        "[data-reports-difference]",
      ),

    periodLabel:
      document.querySelector(
        "[data-reports-period-label]",
      ),

    tableBody:
      document.querySelector(
        "[data-reports-table-body]",
      ),

    empty:
      document.querySelector(
        "[data-reports-empty]",
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


function formatCurrency(
  value,
) {
  return Number(
    value ||
    0,
  ).toLocaleString(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    },
  );
}


function formatSignedCurrency(
  value,
) {
  const number =
    Number(
      value ||
      0,
    );


  if (
    Math.abs(
      number,
    ) <
    0.005
  ) {
    return formatCurrency(
      0,
    );
  }


  const absolute =
    formatCurrency(
      Math.abs(
        number,
      ),
    );


  return number > 0
    ? `+ ${absolute}`
    : `- ${absolute}`;
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


function getCurrentMonth() {
  const now =
    new Date();


  return [
    now.getFullYear(),

    String(
      now.getMonth() +
      1,
    ).padStart(
      2,
      "0",
    ),
  ].join(
    "-",
  );
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
    !year
    ||
    !month
    ||
    month < 1
    ||
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
      `${yearText}-${monthText}-${String(
        lastDay,
      ).padStart(
        2,
        "0",
      )}`,
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
    !year
    ||
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
  text = "",
  state = "",
) {
  elements.message.textContent =
    text;


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


/* =========================================================
   DADOS
========================================================= */

async function loadReport(
  elements,
) {
  const period =
    getMonthPeriod(
      elements.month.value,
    );


  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_monthly_management_report",
      {
        p_data_inicial:
          period.start,

        p_data_final:
          period.end,

        p_regional_id:
          elements.regional.value ||
          null,
      },
    );


  if (
    error
  ) {
    throw error;
  }


  reportRows =
    data ||
    [];
}


/* =========================================================
   FILTROS
========================================================= */

function getFilteredRows(
  elements,
) {
  const type =
    elements.type.value;


  const conference =
    elements.conference.value;


  const search =
    normalizeText(
      elements.search.value,
    );


  return reportRows.filter(
    (row) => {

      const searchable =
        normalizeText(
          [
            row.atividade,
            row.escola_nome,
            row.regional_nome,
            EVENT_TYPE_LABELS[
              row.tipo_evento
            ],
          ].join(
            " ",
          ),
        );


      return (
        (
          !type
          ||
          row.tipo_evento ===
            type
        )

        &&

        (
          !conference
          ||
          row.conferencia_status ===
            conference
        )

        &&

        (
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
  const events =
    rows.length;


  const participants =
    rows.reduce(
      (
        total,
        row,
      ) =>
        total +
        Number(
          row.participantes_reais ||
          0,
        ),

      0,
    );


  const minutes =
    rows.reduce(
      (
        total,
        row,
      ) =>
        total +
        Number(
          row.minutos_instrutores ||
          0,
        ),

      0,
    );


  const photos =
    rows.reduce(
      (
        total,
        row,
      ) =>
        total +
        Number(
          row.fotos_quantidade ||
          0,
        ),

      0,
    );


  const forecast =
    rows.reduce(
      (
        total,
        row,
      ) =>
        total +
        Number(
          row.valor_previsto ||
          0,
        ),

      0,
    );


  const expense =
    rows.reduce(
      (
        total,
        row,
      ) =>
        total +
        Number(
          row.valor_realizado ||
          0,
        ),

      0,
    );


  const difference =
    expense -
    forecast;


  const averageParticipants =
    events >
      0
      ? participants /
        events
      : 0;


  elements.events.textContent =
    String(
      events,
    );


  elements.participants.textContent =
    String(
      participants,
    );


  elements.hours.textContent =
    formatMinutes(
      minutes,
    );


  elements.photos.textContent =
    String(
      photos,
    );


  elements.averageParticipants.textContent =
    averageParticipants.toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          1,

        maximumFractionDigits:
          1,
      },
    );


  elements.forecast.textContent =
    formatCurrency(
      forecast,
    );


  elements.expense.textContent =
    formatCurrency(
      expense,
    );


  elements.difference.textContent =
    formatSignedCurrency(
      difference,
    );


  elements.difference.dataset.state =
    difference > 0.005
      ? "negative"
      : difference < -0.005
        ? "positive"
        : "neutral";
}


/* =========================================================
   CÉLULAS
========================================================= */

function createTextCell(
  value,
) {
  const cell =
    document.createElement(
      "td",
    );


  cell.textContent =
    value;


  return cell;
}


function createCurrencyCell(
  value,
  signed = false,
) {
  const cell =
    document.createElement(
      "td",
    );


  cell.className =
    "reports-money-cell";


  const strong =
    document.createElement(
      "strong",
    );


  strong.textContent =
    signed
      ? formatSignedCurrency(
          value,
        )
      : formatCurrency(
          value,
        );


  if (
    signed
  ) {
    const number =
      Number(
        value ||
        0,
      );


    strong.dataset.state =
      number > 0.005
        ? "negative"
        : number < -0.005
          ? "positive"
          : "neutral";
  }


  cell.append(
    strong,
  );


  return cell;
}


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
    "reports-event";


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


  type.textContent =
    EVENT_TYPE_LABELS[
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


function createConferenceCell(
  status,
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
    `reports-conference reports-conference-${status}`;


  badge.textContent =
    CONFERENCE_LABELS[
      status
    ] ||
    status;


  cell.append(
    badge,
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
    (item) => {

      const row =
        document.createElement(
          "tr",
        );


      row.append(
        createTextCell(
          formatDateBR(
            item.data_real,
          ),
        ),

        createEventCell(
          item,
        ),

        createTextCell(
          item.escola_nome,
        ),

        createTextCell(
          item.regional_nome,
        ),

        createTextCell(
          String(
            item.participantes_reais ??
            "—",
          ),
        ),

        createTextCell(
          String(
            item.instrutores_quantidade ||
            0,
          ),
        ),

        createTextCell(
          formatMinutes(
            item.minutos_instrutores,
          ),
        ),

        createTextCell(
          String(
            item.fotos_quantidade ||
            0,
          ),
        ),

        createCurrencyCell(
          item.valor_previsto,
        ),

        createCurrencyCell(
          item.valor_realizado,
        ),

        createCurrencyCell(
          item.diferenca_financeira,
          true,
        ),

        createConferenceCell(
          item.conferencia_status,
        ),
      );


      elements.tableBody.append(
        row,
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


  const regionalLabel =
    elements.regional
      .selectedOptions?.[0]
      ?.textContent
      ?.trim()
      ||
    "Todas";


  elements.periodLabel.textContent =
    `${getMonthLabel(elements.month.value)} · ${regionalLabel}`;


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


  elements.print.disabled =
    rows.length ===
    0;
}


/* =========================================================
   CSV
========================================================= */

function escapeCsvValue(
  value,
) {
  return `"${String(
    value ??
    "",
  ).replace(
    /"/g,
    '""',
  )}"`;
}


function formatDecimalCsv(
  value,
) {
  return Number(
    value ||
    0,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
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
    rows.length ===
    0
  ) {
    return;
  }


  const headers = [
    "Data programada",
    "Data real",
    "Evento",
    "Tipo",
    "Escola",
    "Regional",
    "Participantes",
    "Instrutores",
    "Minutos de instrutores",
    "Fotos",
    "Previsto",
    "Realizado",
    "Diferença",
    "Conferência",
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
          row.data_programada,
        ),

        formatDateBR(
          row.data_real,
        ),

        row.atividade,

        EVENT_TYPE_LABELS[
          row.tipo_evento
        ] ||
        row.tipo_evento,

        row.escola_nome,

        row.regional_nome,

        row.participantes_reais ??
        "",

        row.instrutores_quantidade,

        row.minutos_instrutores,

        row.fotos_quantidade,

        formatDecimalCsv(
          row.valor_previsto,
        ),

        formatDecimalCsv(
          row.valor_realizado,
        ),

        formatDecimalCsv(
          row.diferenca_financeira,
        ),

        CONFERENCE_LABELS[
          row.conferencia_status
        ] ||
        row.conferencia_status,
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
    "\uFEFF"
    +
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


  link.download =
    `yxz-relatorio-${elements.month.value}.csv`;


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
   ATUALIZAR
========================================================= */

async function refreshReport(
  elements,
) {
  try {

    setMessage(
      elements,
      "Atualizando relatório...",
      "loading",
    );


    await loadReport(
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
      "[YXZ] Erro ao carregar relatório:",
      error,
    );


    reportRows =
      [];


    render(
      elements,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar o relatório.",
      "error",
    );
  }
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

      await refreshReport(
        elements,
      );
    },
  );


  elements.regional.addEventListener(
    "change",
    async () => {

      await refreshReport(
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


  elements.conference.addEventListener(
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


  elements.refresh.addEventListener(
    "click",
    async () => {

      await refreshReport(
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


  elements.print.addEventListener(
    "click",
    () => {

      window.print();
    },
  );
}


/* =========================================================
   INIT
========================================================= */

export async function initRelatoriosPage() {
  const elements =
    getElements();


  elements.month.value =
    getCurrentMonth();


  bindEvents(
    elements,
  );


  try {

    setMessage(
      elements,
      "Carregando relatório...",
      "loading",
    );


    await loadRegionals();


    populateRegionals(
      elements,
    );


    await refreshReport(
      elements,
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Não foi possível iniciar Relatórios:",
      error,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar o módulo de Relatórios.",
      "error",
    );
  }
}