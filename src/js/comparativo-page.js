import {
  supabase,
} from "./supabase.js";


const EVENT_TYPE_LABELS = {
  oficina_educacional:
    "Oficina Educacional",

  evento_comunidade:
    "Evento à Comunidade",
};


const EVENT_STATUS_LABELS = {
  agendada:
    "Agendado",

  realizada:
    "Realizado",

  cancelada:
    "Cancelado",
};


const SITUATION_LABELS = {
  abaixo:
    "Abaixo do previsto",

  conforme:
    "Dentro do previsto",

  acima:
    "Acima do previsto",

  sem_previsao:
    "Sem previsão",

  sem_gasto:
    "Sem gasto",

  sem_movimento:
    "Sem movimentação",
};


let regionals =
  [];

let categories =
  [];

let comparisonRows =
  [];

let selectedEventId =
  null;


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-comparison-message]",
      ),

    month:
      document.querySelector(
        "[data-comparison-month]",
      ),

    regional:
      document.querySelector(
        "[data-comparison-regional]",
      ),

    type:
      document.querySelector(
        "[data-comparison-type]",
      ),

    eventStatus:
      document.querySelector(
        "[data-comparison-event-status]",
      ),

    situation:
      document.querySelector(
        "[data-comparison-situation]",
      ),

    search:
      document.querySelector(
        "[data-comparison-search]",
      ),

    refresh:
      document.querySelector(
        "[data-comparison-refresh]",
      ),

    export:
      document.querySelector(
        "[data-comparison-export]",
      ),

    forecast:
      document.querySelector(
        "[data-comparison-forecast]",
      ),

    expense:
      document.querySelector(
        "[data-comparison-expense]",
      ),

    difference:
      document.querySelector(
        "[data-comparison-difference]",
      ),

    execution:
      document.querySelector(
        "[data-comparison-execution]",
      ),

    overBudget:
      document.querySelector(
        "[data-comparison-over-budget]",
      ),

    categoryBody:
      document.querySelector(
        "[data-comparison-category-body]",
      ),

    eventBody:
      document.querySelector(
        "[data-comparison-event-body]",
      ),

    periodLabel:
      document.querySelector(
        "[data-comparison-period-label]",
      ),

    empty:
      document.querySelector(
        "[data-comparison-empty]",
      ),

    dialog:
      document.getElementById(
        "comparisonDialog",
      ),

    dialogTitle:
      document.querySelector(
        "[data-comparison-dialog-title]",
      ),

    dialogEvent:
      document.querySelector(
        "[data-comparison-dialog-event]",
      ),

    dialogSchool:
      document.querySelector(
        "[data-comparison-dialog-school]",
      ),

    dialogRegional:
      document.querySelector(
        "[data-comparison-dialog-regional]",
      ),

    dialogDate:
      document.querySelector(
        "[data-comparison-dialog-date]",
      ),

    dialogSituation:
      document.querySelector(
        "[data-comparison-dialog-situation]",
      ),

    dialogForecast:
      document.querySelector(
        "[data-comparison-dialog-forecast]",
      ),

    dialogExpense:
      document.querySelector(
        "[data-comparison-dialog-expense]",
      ),

    dialogDifference:
      document.querySelector(
        "[data-comparison-dialog-difference]",
      ),

    dialogBody:
      document.querySelector(
        "[data-comparison-dialog-body]",
      ),

    dialogCloseButtons:
      document.querySelectorAll(
        "[data-comparison-dialog-close]",
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


  const formatted =
    formatCurrency(
      Math.abs(
        number,
      ),
    );


  return number > 0
    ? `+ ${formatted}`
    : `- ${formatted}`;
}


function formatPercentage(
  value,
) {
  if (
    value ===
    null
    ||
    !Number.isFinite(
      value,
    )
  ) {
    return "—";
  }


  return `${value.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  )}%`;
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
   CÁLCULOS
========================================================= */

function getDifference(
  forecast,
  expense,
) {
  return (
    Number(
      expense ||
      0,
    )
    -
    Number(
      forecast ||
      0,
    )
  );
}


function getExecutionPercentage(
  forecast,
  expense,
) {
  const forecastValue =
    Number(
      forecast ||
      0,
    );


  const expenseValue =
    Number(
      expense ||
      0,
    );


  if (
    forecastValue <= 0
  ) {
    return null;
  }


  return (
    expenseValue /
    forecastValue
  ) * 100;
}


function getFinancialSituation(
  forecast,
  expense,
) {
  const forecastValue =
    Number(
      forecast ||
      0,
    );


  const expenseValue =
    Number(
      expense ||
      0,
    );


  if (
    forecastValue === 0
    &&
    expenseValue === 0
  ) {
    return "sem_movimento";
  }


  if (
    forecastValue === 0
    &&
    expenseValue > 0
  ) {
    return "sem_previsao";
  }


  if (
    forecastValue > 0
    &&
    expenseValue === 0
  ) {
    return "sem_gasto";
  }


  const difference =
    getDifference(
      forecastValue,
      expenseValue,
    );


  if (
    Math.abs(
      difference,
    )
    <
    0.005
  ) {
    return "conforme";
  }


  if (
    difference >
    0
  ) {
    return "acima";
  }


  return "abaixo";
}


/* =========================================================
   DADOS BASE
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


async function loadCategories() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "categorias_financeiras",
      )
      .select(`
        codigo,
        nome,
        ordem,
        ativo
      `)
      .eq(
        "ativo",
        true,
      )
      .order(
        "ordem",
      );


  if (
    error
  ) {
    throw error;
  }


  categories =
    data ||
    [];
}


/* =========================================================
   COMPARATIVO
========================================================= */

async function loadComparison(
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
      "get_financial_comparison",
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


  comparisonRows =
    data ||
    [];
}


/* =========================================================
   REGIONAIS
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


/* =========================================================
   AGRUPAR POR EVENTO
========================================================= */

function getGroupedEvents() {
  const grouped =
    new Map();


  comparisonRows.forEach(
    (row) => {

      if (
        !grouped.has(
          row.evento_id,
        )
      ) {
        grouped.set(
          row.evento_id,
          {
            id:
              row.evento_id,

            tipo_evento:
              row.tipo_evento,

            regional_id:
              row.regional_id,

            regional_nome:
              row.regional_nome,

            escola_id:
              row.escola_id,

            escola_nome:
              row.escola_nome,

            atividade:
              row.atividade,

            data_evento:
              row.data_evento,

            status_evento:
              row.status_evento,

            categories:
              new Map(),
          },
        );
      }


      grouped
        .get(
          row.evento_id,
        )
        .categories
        .set(
          row.categoria_codigo,
          {
            codigo:
              row.categoria_codigo,

            nome:
              row.categoria_nome,

            ordem:
              row.categoria_ordem,

            previsto:
              Number(
                row.valor_previsto ||
                0,
              ),

            realizado:
              Number(
                row.valor_realizado ||
                0,
              ),
          },
        );
    },
  );


  return Array.from(
    grouped.values(),
  ).map(
    (event) => {

      const categoryValues =
        Array.from(
          event.categories.values(),
        );


      const forecast =
        categoryValues.reduce(
          (
            total,
            category,
          ) =>
            total +
            category.previsto,

          0,
        );


      const expense =
        categoryValues.reduce(
          (
            total,
            category,
          ) =>
            total +
            category.realizado,

          0,
        );


      return {
        ...event,

        previsto:
          forecast,

        realizado:
          expense,

        diferenca:
          getDifference(
            forecast,
            expense,
          ),

        execucao:
          getExecutionPercentage(
            forecast,
            expense,
          ),

        situacao:
          getFinancialSituation(
            forecast,
            expense,
          ),
      };
    },
  );
}


/* =========================================================
   FILTROS
========================================================= */

function getFilteredEvents(
  elements,
) {
  const type =
    elements.type.value;


  const status =
    elements.eventStatus.value;


  const situation =
    elements.situation.value;


  const search =
    normalizeText(
      elements.search.value,
    );


  return getGroupedEvents()
    .filter(
      (event) => {

        const searchable =
          normalizeText(
            [
              event.atividade,
              event.escola_nome,
              event.regional_nome,
              EVENT_TYPE_LABELS[
                event.tipo_evento
              ],
            ].join(
              " ",
            ),
          );


        return (
          (
            !type
            ||
            event.tipo_evento ===
              type
          )

          &&

          (
            !status
            ||
            event.status_evento ===
              status
          )

          &&

          (
            !situation
            ||
            event.situacao ===
              situation
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
    )
    .sort(
      (
        a,
        b,
      ) =>
        a.data_evento.localeCompare(
          b.data_evento,
        )
        ||
        a.atividade.localeCompare(
          b.atividade,
          "pt-BR",
        ),
    );
}


/* =========================================================
   RESUMO
========================================================= */

function renderSummary(
  elements,
  events,
) {
  const forecast =
    events.reduce(
      (
        total,
        event,
      ) =>
        total +
        event.previsto,

      0,
    );


  const expense =
    events.reduce(
      (
        total,
        event,
      ) =>
        total +
        event.realizado,

      0,
    );


  const difference =
    getDifference(
      forecast,
      expense,
    );


  const execution =
    getExecutionPercentage(
      forecast,
      expense,
    );


  const overBudget =
    events.filter(
      (event) =>
        event.situacao ===
        "acima"
        ||
        event.situacao ===
        "sem_previsao",
    ).length;


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


  elements.execution.textContent =
    formatPercentage(
      execution,
    );


  elements.overBudget.textContent =
    String(
      overBudget,
    );
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
  {
    strong = false,
    signed = false,
  } = {},
) {
  const cell =
    document.createElement(
      "td",
    );


  cell.className =
    "comparison-money-cell";


  const content =
    strong
      ? document.createElement(
          "strong",
        )
      : cell;


  content.textContent =
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


    content.dataset.state =
      number > 0.005
        ? "negative"
        : number < -0.005
          ? "positive"
          : "neutral";
  }


  if (
    strong
  ) {
    cell.append(
      content,
    );
  }


  return cell;
}


/* =========================================================
   EXECUÇÃO %
========================================================= */

function createExecutionCell(
  forecast,
  expense,
) {
  const cell =
    document.createElement(
      "td",
    );


  const percentage =
    getExecutionPercentage(
      forecast,
      expense,
    );


  const wrapper =
    document.createElement(
      "div",
    );


  wrapper.className =
    "comparison-execution";


  const label =
    document.createElement(
      "strong",
    );


  label.textContent =
    formatPercentage(
      percentage,
    );


  wrapper.append(
    label,
  );


  if (
    percentage !==
    null
  ) {
    const track =
      document.createElement(
        "div",
      );


    track.className =
      "comparison-progress";


    const bar =
      document.createElement(
        "span",
      );


    bar.style.width =
      `${Math.min(
        Math.max(
          percentage,
          0,
        ),
        100,
      )}%`;


    if (
      percentage >
      100
    ) {
      bar.classList.add(
        "comparison-progress-over",
      );
    }


    track.append(
      bar,
    );


    wrapper.append(
      track,
    );
  }


  cell.append(
    wrapper,
  );


  return cell;
}


/* =========================================================
   BADGE
========================================================= */

function createSituationBadge(
  situation,
) {
  const badge =
    document.createElement(
      "span",
    );


  badge.className =
    `comparison-badge comparison-badge-${situation}`;


  badge.textContent =
    SITUATION_LABELS[
      situation
    ] ||
    situation;


  return badge;
}


/* =========================================================
   CATEGORIAS
========================================================= */

function renderCategories(
  elements,
  events,
) {
  elements.categoryBody
    .replaceChildren();


  categories.forEach(
    (category) => {

      let forecast =
        0;


      let expense =
        0;


      events.forEach(
        (event) => {

          const categoryData =
            event.categories.get(
              category.codigo,
            );


          forecast +=
            categoryData?.previsto ||
            0;


          expense +=
            categoryData?.realizado ||
            0;
        },
      );


      const difference =
        getDifference(
          forecast,
          expense,
        );


      const row =
        document.createElement(
          "tr",
        );


      const categoryCell =
        document.createElement(
          "td",
        );


      const categoryName =
        document.createElement(
          "strong",
        );


      categoryName.textContent =
        category.nome;


      categoryCell.append(
        categoryName,
      );


      row.append(
        categoryCell,

        createCurrencyCell(
          forecast,
        ),

        createCurrencyCell(
          expense,
        ),

        createCurrencyCell(
          difference,
          {
            strong:
              true,

            signed:
              true,
          },
        ),

        createExecutionCell(
          forecast,
          expense,
        ),
      );


      elements.categoryBody.append(
        row,
      );
    },
  );
}


/* =========================================================
   EVENTO
========================================================= */

function createEventNameCell(
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
    "comparison-event-name";


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


  type.textContent =
    EVENT_TYPE_LABELS[
      event.tipo_evento
    ] ||
    event.tipo_evento;


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
   TABELA DE EVENTOS
========================================================= */

function renderEvents(
  elements,
  events,
) {
  elements.eventBody
    .replaceChildren();


  elements.empty.hidden =
    events.length >
    0;


  events.forEach(
    (event) => {

      const row =
        document.createElement(
          "tr",
        );


      row.append(
        createTextCell(
          formatDateBR(
            event.data_evento,
          ),
        ),

        createEventNameCell(
          event,
        ),

        createTextCell(
          event.escola_nome,
        ),

        createTextCell(
          event.regional_nome,
        ),

        createCurrencyCell(
          event.previsto,
        ),

        createCurrencyCell(
          event.realizado,
        ),

        createCurrencyCell(
          event.diferenca,
          {
            strong:
              true,

            signed:
              true,
          },
        ),

        createExecutionCell(
          event.previsto,
          event.realizado,
        ),
      );


      const situation =
        document.createElement(
          "td",
        );


      situation.append(
        createSituationBadge(
          event.situacao,
        ),
      );


      const actions =
        document.createElement(
          "td",
        );


      const detail =
        document.createElement(
          "button",
        );


      detail.type =
        "button";


      detail.className =
        "btn btn-ghost";


      detail.textContent =
        "Detalhar";


      detail.addEventListener(
        "click",
        () => {

          openComparisonDialog(
            event.id,
            elements,
          );
        },
      );


      actions.append(
        detail,
      );


      row.append(
        situation,
        actions,
      );


      elements.eventBody.append(
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
  const events =
    getFilteredEvents(
      elements,
    );


  elements.periodLabel.textContent =
    getMonthLabel(
      elements.month.value,
    );


  renderSummary(
    elements,
    events,
  );


  renderCategories(
    elements,
    events,
  );


  renderEvents(
    elements,
    events,
  );


  elements.export.disabled =
    events.length ===
    0;
}


/* =========================================================
   MODAL
========================================================= */

function openComparisonDialog(
  eventId,
  elements,
) {
  const event =
    getGroupedEvents().find(
      (item) =>
        item.id ===
        eventId,
    );


  if (
    !event
  ) {
    return;
  }


  selectedEventId =
    event.id;


  elements.dialogTitle.textContent =
    event.atividade;


  elements.dialogEvent.textContent =
    event.atividade;


  elements.dialogSchool.textContent =
    event.escola_nome;


  elements.dialogRegional.textContent =
    event.regional_nome;


  elements.dialogDate.textContent =
    formatDateBR(
      event.data_evento,
    );


  elements.dialogSituation.textContent =
    SITUATION_LABELS[
      event.situacao
    ] ||
    event.situacao;


  elements.dialogForecast.textContent =
    formatCurrency(
      event.previsto,
    );


  elements.dialogExpense.textContent =
    formatCurrency(
      event.realizado,
    );


  elements.dialogDifference.textContent =
    formatSignedCurrency(
      event.diferenca,
    );


  elements.dialogDifference.dataset.state =
    event.diferenca > 0.005
      ? "negative"
      : event.diferenca < -0.005
        ? "positive"
        : "neutral";


  elements.dialogBody
    .replaceChildren();


  categories.forEach(
    (category) => {

      const values =
        event.categories.get(
          category.codigo,
        )
        ||
        {
          previsto:
            0,

          realizado:
            0,
        };


      const difference =
        getDifference(
          values.previsto,
          values.realizado,
        );


      const row =
        document.createElement(
          "tr",
        );


      row.append(
        createTextCell(
          category.nome,
        ),

        createCurrencyCell(
          values.previsto,
        ),

        createCurrencyCell(
          values.realizado,
        ),

        createCurrencyCell(
          difference,
          {
            strong:
              true,

            signed:
              true,
          },
        ),

        createExecutionCell(
          values.previsto,
          values.realizado,
        ),
      );


      elements.dialogBody.append(
        row,
      );
    },
  );


  elements.dialog.showModal();
}


function closeComparisonDialog(
  elements,
) {
  selectedEventId =
    null;


  if (
    elements.dialog.open
  ) {
    elements.dialog.close();
  }
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
  const events =
    getFilteredEvents(
      elements,
    );


  if (
    events.length ===
    0
  ) {
    return;
  }


  const headers = [
    "Data",
    "Evento",
    "Tipo",
    "Escola",
    "Regional",
    "Situação do evento",
    "Previsto",
    "Realizado",
    "Diferença",
    "Execução %",
    "Situação financeira",
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


  events.forEach(
    (event) => {

      const values = [
        formatDateBR(
          event.data_evento,
        ),

        event.atividade,

        EVENT_TYPE_LABELS[
          event.tipo_evento
        ] ||
        event.tipo_evento,

        event.escola_nome,

        event.regional_nome,

        EVENT_STATUS_LABELS[
          event.status_evento
        ] ||
        event.status_evento,

        formatDecimalCsv(
          event.previsto,
        ),

        formatDecimalCsv(
          event.realizado,
        ),

        formatDecimalCsv(
          event.diferenca,
        ),

        event.execucao ===
          null
          ? ""
          : formatDecimalCsv(
              event.execucao,
            ),

        SITUATION_LABELS[
          event.situacao
        ] ||
        event.situacao,
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
    `yxz-comparativo-${elements.month.value}.csv`;


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

async function refreshComparison(
  elements,
) {
  try {

    setMessage(
      elements,
      "Atualizando comparativo...",
      "loading",
    );


    await loadComparison(
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
      "[YXZ] Erro no comparativo financeiro:",
      error,
    );


    comparisonRows =
      [];


    render(
      elements,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar o comparativo financeiro.",
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
  elements.month.addEventListener(
    "change",
    async () => {

      await refreshComparison(
        elements,
      );
    },
  );


  elements.regional.addEventListener(
    "change",
    async () => {

      await refreshComparison(
        elements,
      );
    },
  );


  [
    elements.type,
    elements.eventStatus,
    elements.situation,
  ].forEach(
    (element) => {

      element.addEventListener(
        "change",
        () => {

          render(
            elements,
          );
        },
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

      await refreshComparison(
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


  elements.dialogCloseButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          closeComparisonDialog(
            elements,
          );
        },
      );
    },
  );


  elements.dialog.addEventListener(
    "cancel",
    (
      event,
    ) => {

      event.preventDefault();


      closeComparisonDialog(
        elements,
      );
    },
  );
}


/* =========================================================
   INIT
========================================================= */

export async function initComparativoPage() {
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
      "Carregando comparativo financeiro...",
      "loading",
    );


    await Promise.all([
      loadRegionals(),
      loadCategories(),
    ]);


    populateRegionals(
      elements,
    );


    await refreshComparison(
      elements,
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Não foi possível iniciar Comparativo:",
      error,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar o módulo Comparativo.",
      "error",
    );
  }
}