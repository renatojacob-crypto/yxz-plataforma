import {
  supabase,
} from "./supabase.js";


import {
  hasPermission,
} from "./auth.js";


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


const EXPENSE_MANAGE_PERMISSION =
  "gastos.gerenciar";


let regionals =
  [];

let schools =
  [];

let categories =
  [];

let events =
  [];

let expenseItems =
  [];

let selectedEventId =
  null;

let editingItemId =
  null;

let canManage =
  false;


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-expenses-message]",
      ),

    month:
      document.querySelector(
        "[data-expenses-month]",
      ),

    regional:
      document.querySelector(
        "[data-expenses-regional]",
      ),

    type:
      document.querySelector(
        "[data-expenses-type]",
      ),

    statusFilter:
      document.querySelector(
        "[data-expenses-status]",
      ),

    search:
      document.querySelector(
        "[data-expenses-search]",
      ),

    refresh:
      document.querySelector(
        "[data-expenses-refresh]",
      ),

    total:
      document.querySelector(
        "[data-expenses-total]",
      ),

    eventsWith:
      document.querySelector(
        "[data-expenses-events-with]",
      ),

    eventsWithout:
      document.querySelector(
        "[data-expenses-events-without]",
      ),

    items:
      document.querySelector(
        "[data-expenses-items]",
      ),

    average:
      document.querySelector(
        "[data-expenses-average]",
      ),

    periodLabel:
      document.querySelector(
        "[data-expenses-period-label]",
      ),

    tableBody:
      document.querySelector(
        "[data-expenses-table-body]",
      ),

    empty:
      document.querySelector(
        "[data-expenses-empty]",
      ),

    dialog:
      document.getElementById(
        "expenseDialog",
      ),

    dialogTitle:
      document.querySelector(
        "[data-expense-dialog-title]",
      ),

    eventType:
      document.querySelector(
        "[data-expense-event-type]",
      ),

    eventName:
      document.querySelector(
        "[data-expense-event-name]",
      ),

    eventSchool:
      document.querySelector(
        "[data-expense-event-school]",
      ),

    eventRegional:
      document.querySelector(
        "[data-expense-event-regional]",
      ),

    eventDate:
      document.querySelector(
        "[data-expense-event-date]",
      ),

    eventTotal:
      document.querySelector(
        "[data-expense-event-total]",
      ),

    itemCount:
      document.querySelector(
        "[data-expense-item-count]",
      ),

    itemsBody:
      document.querySelector(
        "[data-expense-items-body]",
      ),

    editor:
      document.querySelector(
        "[data-expense-editor]",
      ),

    editorTitle:
      document.querySelector(
        "[data-expense-editor-title]",
      ),

    itemForm:
      document.getElementById(
        "expenseItemForm",
      ),

    date:
      document.querySelector(
        "[data-expense-date]",
      ),

    category:
      document.querySelector(
        "[data-expense-category]",
      ),

    description:
      document.querySelector(
        "[data-expense-description]",
      ),

    quantity:
      document.querySelector(
        "[data-expense-quantity]",
      ),

    unitValue:
      document.querySelector(
        "[data-expense-unit-value]",
      ),

    lineTotal:
      document.querySelector(
        "[data-expense-line-total]",
      ),

    supplier:
      document.querySelector(
        "[data-expense-supplier]",
      ),

    documentReference:
      document.querySelector(
        "[data-expense-document]",
      ),

    notes:
      document.querySelector(
        "[data-expense-notes]",
      ),

    saveItem:
      document.querySelector(
        "[data-expense-save-item]",
      ),

    cancelEdit:
      document.querySelector(
        "[data-expense-editor-cancel]",
      ),

    dialogStatus:
      document.querySelector(
        "[data-expense-status]",
      ),

    closeButtons:
      document.querySelectorAll(
        "[data-expense-dialog-close]",
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


function setPageMessage(
  elements,
  text = "",
  state = "",
) {
  elements.message.textContent =
    text;


  elements.message.dataset.state =
    state;
}


function setDialogStatus(
  elements,
  text = "",
  state = "",
) {
  elements.dialogStatus.textContent =
    text;


  elements.dialogStatus.dataset.state =
    state;
}


/* =========================================================
   ENTIDADES
========================================================= */

function getSchool(
  id,
) {
  return (
    schools.find(
      (item) =>
        item.id ===
        id,
    )
    ||
    null
  );
}


function getRegional(
  id,
) {
  return (
    regionals.find(
      (item) =>
        item.id ===
        id,
    )
    ||
    null
  );
}


function getCategory(
  code,
) {
  return (
    categories.find(
      (item) =>
        item.codigo ===
        code,
    )
    ||
    null
  );
}


function getEvent(
  id,
) {
  return (
    events.find(
      (item) =>
        item.id ===
        id,
    )
    ||
    null
  );
}


function getEventItems(
  eventId,
) {
  return expenseItems.filter(
    (item) =>
      item.evento_id ===
      eventId,
  );
}


function getItemTotal(
  item,
) {
  return (
    Number(
      item.quantidade ||
      0,
    )
    *
    Number(
      item.valor_unitario ||
      0,
    )
  );
}


function getEventTotal(
  eventId,
) {
  return getEventItems(
    eventId,
  ).reduce(
    (
      total,
      item,
    ) =>
      total +
      getItemTotal(
        item,
      ),

    0,
  );
}


function getCategoryTotal(
  eventId,
  categoryCode,
) {
  return getEventItems(
    eventId,
  )
    .filter(
      (item) =>
        item.categoria_codigo ===
        categoryCode,
    )
    .reduce(
      (
        total,
        item,
      ) =>
        total +
        getItemTotal(
          item,
        ),

      0,
    );
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


  if (
    error
  ) {
    throw error;
  }


  schools =
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
   EVENTOS DO MÊS
========================================================= */

async function loadEvents(
  elements,
) {
  const period =
    getMonthPeriod(
      elements.month.value,
    );


  let query =
    supabase
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
        status
      `)
      .gte(
        "data",
        period.start,
      )
      .lte(
        "data",
        period.end,
      )
      .order(
        "data",
      )
      .order(
        "hora_inicio",
      );


  if (
    elements.regional.value
  ) {
    query =
      query.eq(
        "regional_id",
        elements.regional.value,
      );
  }


  const {
    data,
    error,
  } =
    await query;


  if (
    error
  ) {
    throw error;
  }


  events =
    data ||
    [];
}


/* =========================================================
   GASTOS
========================================================= */

async function loadExpenseItems() {
  const eventIds =
    events.map(
      (event) =>
        event.id,
    );


  if (
    eventIds.length ===
    0
  ) {
    expenseItems =
      [];


    return;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "gasto_itens",
      )
      .select(`
        id,
        evento_id,
        categoria_codigo,
        data_gasto,
        descricao,
        quantidade,
        valor_unitario,
        fornecedor,
        documento_referencia,
        observacoes,
        created_at,
        updated_at
      `)
      .in(
        "evento_id",
        eventIds,
      )
      .order(
        "data_gasto",
      )
      .order(
        "created_at",
      );


  if (
    error
  ) {
    throw error;
  }


  expenseItems =
    data ||
    [];
}


/* =========================================================
   SELECTS
========================================================= */

function populateRegionalFilter(
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


function populateCategorySelect(
  elements,
) {
  elements.category
    .replaceChildren();


  categories.forEach(
    (category) => {

      const option =
        document.createElement(
          "option",
        );


      option.value =
        category.codigo;


      option.textContent =
        category.nome;


      elements.category.append(
        option,
      );
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
    elements.statusFilter.value;


  const search =
    normalizeText(
      elements.search.value,
    );


  return events.filter(
    (event) => {

      const school =
        getSchool(
          event.escola_id,
        );


      const regional =
        getRegional(
          event.regional_id,
        );


      const searchable =
        normalizeText(
          [
            event.atividade,
            school?.nome,
            school?.cidade,
            regional?.nome,
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
          event.status ===
            status
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
  filteredEvents,
) {
  const totals =
    filteredEvents.map(
      (event) =>
        getEventTotal(
          event.id,
        ),
    );


  const total =
    totals.reduce(
      (
        sum,
        value,
      ) =>
        sum +
        value,

      0,
    );


  const eventsWith =
    totals.filter(
      (value) =>
        value >
        0,
    ).length;


  const eventsWithout =
    filteredEvents.length -
    eventsWith;


  const eventIds =
    new Set(
      filteredEvents.map(
        (event) =>
          event.id,
      ),
    );


  const items =
    expenseItems.filter(
      (item) =>
        eventIds.has(
          item.evento_id,
        ),
    ).length;


  const average =
    eventsWith >
      0
      ? total /
        eventsWith
      : 0;


  elements.total.textContent =
    formatCurrency(
      total,
    );


  elements.eventsWith.textContent =
    String(
      eventsWith,
    );


  elements.eventsWithout.textContent =
    String(
      eventsWithout,
    );


  elements.items.textContent =
    String(
      items,
    );


  elements.average.textContent =
    formatCurrency(
      average,
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
  strong = false,
) {
  const cell =
    document.createElement(
      "td",
    );


  cell.className =
    "expenses-money-cell";


  if (
    strong
  ) {

    const element =
      document.createElement(
        "strong",
      );


    element.textContent =
      formatCurrency(
        value,
      );


    cell.append(
      element,
    );

  } else {

    cell.textContent =
      formatCurrency(
        value,
      );
  }


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
    "expenses-event-cell";


  const name =
    document.createElement(
      "strong",
    );


  name.textContent =
    event.atividade;


  const meta =
    document.createElement(
      "div",
    );


  meta.className =
    "expenses-event-badges";


  const type =
    document.createElement(
      "span",
    );


  type.className =
    event.tipo_evento ===
      "evento_comunidade"
      ? "expenses-badge expenses-badge-community"
      : "expenses-badge expenses-badge-educational";


  type.textContent =
    EVENT_TYPE_LABELS[
      event.tipo_evento
    ] ||
    event.tipo_evento;


  const status =
    document.createElement(
      "span",
    );


  status.className =
    `expenses-badge expenses-status-${event.status}`;


  status.textContent =
    EVENT_STATUS_LABELS[
      event.status
    ] ||
    event.status;


  meta.append(
    type,
    status,
  );


  wrapper.append(
    name,
    meta,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


/* =========================================================
   AÇÕES
========================================================= */

function createActionCell(
  event,
  elements,
) {
  const cell =
    document.createElement(
      "td",
    );


  const button =
    document.createElement(
      "button",
    );


  button.type =
    "button";


  button.className =
    "btn btn-ghost";


  const hasExpenses =
    getEventItems(
      event.id,
    ).length >
    0;


  if (
    canManage
  ) {

    button.textContent =
      hasExpenses
        ? "Editar gastos"
        : "Lançar gastos";

  } else {

    button.textContent =
      "Visualizar";
  }


  button.addEventListener(
    "click",
    () => {

      openExpenseDialog(
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
   TABELA PRINCIPAL
========================================================= */

function renderTable(
  elements,
  filteredEvents,
) {
  elements.tableBody
    .replaceChildren();


  elements.empty.hidden =
    filteredEvents.length >
    0;


  filteredEvents.forEach(
    (event) => {

      const school =
        getSchool(
          event.escola_id,
        );


      const regional =
        getRegional(
          event.regional_id,
        );


      const row =
        document.createElement(
          "tr",
        );


      row.append(
        createTextCell(
          formatDateBR(
            event.data,
          ),
        ),

        createEventCell(
          event,
        ),

        createTextCell(
          school?.nome ||
          "—",
        ),

        createTextCell(
          regional?.nome ||
          "—",
        ),

        createCurrencyCell(
          getCategoryTotal(
            event.id,
            "deslocamento",
          ),
        ),

        createCurrencyCell(
          getCategoryTotal(
            event.id,
            "alimentacao",
          ),
        ),

        createCurrencyCell(
          getCategoryTotal(
            event.id,
            "hospedagem",
          ),
        ),

        createCurrencyCell(
          getCategoryTotal(
            event.id,
            "materiais",
          ),
        ),

        createCurrencyCell(
          getCategoryTotal(
            event.id,
            "outros",
          ),
        ),

        createCurrencyCell(
          getEventTotal(
            event.id,
          ),
          true,
        ),

        createActionCell(
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


/* =========================================================
   RENDER
========================================================= */

function render(
  elements,
) {
  const filtered =
    getFilteredEvents(
      elements,
    );


  elements.periodLabel.textContent =
    getMonthLabel(
      elements.month.value,
    );


  renderSummary(
    elements,
    filtered,
  );


  renderTable(
    elements,
    filtered,
  );
}


/* =========================================================
   TOTAL ITEM
========================================================= */

function updateLineTotal(
  elements,
) {
  const quantity =
    Number(
      elements.quantity.value ||
      0,
    );


  const unitValue =
    Number(
      elements.unitValue.value ||
      0,
    );


  elements.lineTotal.textContent =
    formatCurrency(
      quantity *
      unitValue,
    );
}


/* =========================================================
   RESET EDITOR
========================================================= */

function resetItemEditor(
  elements,
) {
  const event =
    getEvent(
      selectedEventId,
    );


  editingItemId =
    null;


  elements.itemForm.reset();


  elements.quantity.value =
    "1";


  elements.date.value =
    event?.data ||
    "";


  if (
    categories[0]
  ) {
    elements.category.value =
      categories[0].codigo;
  }


  elements.editorTitle.textContent =
    "Novo gasto";


  elements.saveItem.textContent =
    "Adicionar gasto";


  elements.cancelEdit.hidden =
    true;


  updateLineTotal(
    elements,
  );
}


/* =========================================================
   EDITAR
========================================================= */

function editExpenseItem(
  item,
  elements,
) {
  editingItemId =
    item.id;


  elements.date.value =
    item.data_gasto;


  elements.category.value =
    item.categoria_codigo;


  elements.description.value =
    item.descricao;


  elements.quantity.value =
    String(
      item.quantidade,
    );


  elements.unitValue.value =
    String(
      item.valor_unitario,
    );


  elements.supplier.value =
    item.fornecedor ||
    "";


  elements.documentReference.value =
    item.documento_referencia ||
    "";


  elements.notes.value =
    item.observacoes ||
    "";


  elements.editorTitle.textContent =
    "Editar gasto";


  elements.saveItem.textContent =
    "Salvar alteração";


  elements.cancelEdit.hidden =
    false;


  updateLineTotal(
    elements,
  );


  elements.description.focus();
}


/* =========================================================
   EXCLUIR
========================================================= */

async function deleteExpenseItem(
  item,
  elements,
) {
  const confirmed =
    window.confirm(
      `Deseja excluir o gasto "${item.descricao}"?`,
    );


  if (
    !confirmed
  ) {
    return;
  }


  try {

    setDialogStatus(
      elements,
      "Excluindo gasto...",
      "loading",
    );


    const {
      error,
    } =
      await supabase.rpc(
        "remove_event_expense_item",
        {
          p_id:
            item.id,
        },
      );


    if (
      error
    ) {
      throw error;
    }


    await loadExpenseItems();


    render(
      elements,
    );


    renderExpenseDialog(
      elements,
    );


    setDialogStatus(
      elements,
      "Gasto excluído.",
      "success",
    );

  } catch (
    error
  ) {

    setDialogStatus(
      elements,
      error?.message ||
      "Não foi possível excluir o gasto.",
      "error",
    );
  }
}


/* =========================================================
   ITENS DO MODAL
========================================================= */

function renderExpenseItems(
  elements,
) {
  const items =
    getEventItems(
      selectedEventId,
    );


  elements.itemsBody
    .replaceChildren();


  elements.itemCount.textContent =
    items.length ===
      1
      ? "1 item"
      : `${items.length} itens`;


  if (
    items.length ===
    0
  ) {

    const row =
      document.createElement(
        "tr",
      );


    const cell =
      document.createElement(
        "td",
      );


    cell.colSpan =
      7;


    cell.className =
      "expenses-items-empty";


    cell.textContent =
      "Nenhum gasto lançado.";


    row.append(
      cell,
    );


    elements.itemsBody.append(
      row,
    );


    return;
  }


  items.forEach(
    (item) => {

      const row =
        document.createElement(
          "tr",
        );


      const category =
        getCategory(
          item.categoria_codigo,
        );


      row.append(
        createTextCell(
          formatDateBR(
            item.data_gasto,
          ),
        ),

        createTextCell(
          category?.nome ||
          item.categoria_codigo,
        ),

        createTextCell(
          item.descricao,
        ),

        createTextCell(
          Number(
            item.quantidade,
          ).toLocaleString(
            "pt-BR",
            {
              maximumFractionDigits:
                2,
            },
          ),
        ),

        createCurrencyCell(
          item.valor_unitario,
        ),

        createCurrencyCell(
          getItemTotal(
            item,
          ),
          true,
        ),
      );


      const actions =
        document.createElement(
          "td",
        );


      if (
        canManage
      ) {

        const editButton =
          document.createElement(
            "button",
          );


        editButton.type =
          "button";


        editButton.className =
          "expenses-item-action";


        editButton.textContent =
          "Editar";


        editButton.addEventListener(
          "click",
          () => {

            editExpenseItem(
              item,
              elements,
            );
          },
        );


        const deleteButton =
          document.createElement(
            "button",
          );


        deleteButton.type =
          "button";


        deleteButton.className =
          "expenses-item-action expenses-item-delete";


        deleteButton.textContent =
          "Excluir";


        deleteButton.addEventListener(
          "click",
          async () => {

            await deleteExpenseItem(
              item,
              elements,
            );
          },
        );


        actions.append(
          editButton,
          deleteButton,
        );

      } else {

        actions.textContent =
          "—";
      }


      row.append(
        actions,
      );


      elements.itemsBody.append(
        row,
      );
    },
  );
}


/* =========================================================
   MODAL
========================================================= */

function renderExpenseDialog(
  elements,
) {
  const event =
    getEvent(
      selectedEventId,
    );


  if (
    !event
  ) {
    return;
  }


  const school =
    getSchool(
      event.escola_id,
    );


  const regional =
    getRegional(
      event.regional_id,
    );


  elements.dialogTitle.textContent =
    getEventItems(
      event.id,
    ).length >
      0
      ? "Editar gastos"
      : "Registrar gastos";


  elements.eventType.textContent =
    EVENT_TYPE_LABELS[
      event.tipo_evento
    ] ||
    event.tipo_evento;


  elements.eventType.className =
    event.tipo_evento ===
      "evento_comunidade"
      ? "expenses-event-type expenses-event-type-community"
      : "expenses-event-type expenses-event-type-educational";


  elements.eventName.textContent =
    event.atividade;


  elements.eventSchool.textContent =
    school?.nome ||
    "—";


  elements.eventRegional.textContent =
    regional?.nome ||
    "—";


  elements.eventDate.textContent =
    formatDateBR(
      event.data,
    );


  elements.eventTotal.textContent =
    formatCurrency(
      getEventTotal(
        event.id,
      ),
    );


  elements.editor.hidden =
    !canManage;


  renderExpenseItems(
    elements,
  );
}


/* =========================================================
   ABRIR / FECHAR
========================================================= */

function openExpenseDialog(
  eventId,
  elements,
) {
  const event =
    getEvent(
      eventId,
    );


  if (
    !event
  ) {
    return;
  }


  selectedEventId =
    event.id;


  resetItemEditor(
    elements,
  );


  setDialogStatus(
    elements,
  );


  renderExpenseDialog(
    elements,
  );


  elements.dialog.showModal();
}


function closeExpenseDialog(
  elements,
) {
  selectedEventId =
    null;


  editingItemId =
    null;


  setDialogStatus(
    elements,
  );


  if (
    elements.dialog.open
  ) {
    elements.dialog.close();
  }
}


/* =========================================================
   SALVAR
========================================================= */

async function saveExpenseItem(
  elements,
) {
  const event =
    getEvent(
      selectedEventId,
    );


  if (
    !event
  ) {

    setDialogStatus(
      elements,
      "Evento não encontrado.",
      "error",
    );


    return;
  }


  const expenseDate =
    elements.date.value;


  const categoryCode =
    elements.category.value;


  const description =
    elements.description.value
      .trim();


  const quantity =
    Number(
      elements.quantity.value,
    );


  const unitValue =
    Number(
      elements.unitValue.value,
    );


  const supplier =
    elements.supplier.value
      .trim() ||
    null;


  const documentReference =
    elements.documentReference.value
      .trim() ||
    null;


  const notes =
    elements.notes.value
      .trim() ||
    null;


  if (
    !expenseDate
  ) {

    setDialogStatus(
      elements,
      "Informe a data do gasto.",
      "error",
    );


    return;
  }


  if (
    !categoryCode
  ) {

    setDialogStatus(
      elements,
      "Selecione uma categoria.",
      "error",
    );


    return;
  }


  if (
    !description
  ) {

    setDialogStatus(
      elements,
      "Informe a descrição do gasto.",
      "error",
    );


    elements.description.focus();


    return;
  }


  if (
    !Number.isFinite(
      quantity,
    )
    ||
    quantity <= 0
  ) {

    setDialogStatus(
      elements,
      "Informe uma quantidade maior que zero.",
      "error",
    );


    return;
  }


  if (
    !Number.isFinite(
      unitValue,
    )
    ||
    unitValue <= 0
  ) {

    setDialogStatus(
      elements,
      "Informe um valor unitário maior que zero.",
      "error",
    );


    return;
  }


  elements.saveItem.disabled =
    true;


  try {

    setDialogStatus(
      elements,
      editingItemId
        ? "Salvando alteração..."
        : "Adicionando gasto...",
      "loading",
    );


    const {
      error,
    } =
      await supabase.rpc(
        "save_event_expense_item",
        {
          p_evento_id:
            event.id,

          p_categoria_codigo:
            categoryCode,

          p_data_gasto:
            expenseDate,

          p_descricao:
            description,

          p_quantidade:
            quantity,

          p_valor_unitario:
            unitValue,

          p_fornecedor:
            supplier,

          p_documento_referencia:
            documentReference,

          p_observacoes:
            notes,

          p_id:
            editingItemId,
        },
      );


    if (
      error
    ) {
      throw error;
    }


    await loadExpenseItems();


    render(
      elements,
    );


    resetItemEditor(
      elements,
    );


    renderExpenseDialog(
      elements,
    );


    setDialogStatus(
      elements,
      "Gasto salvo com sucesso.",
      "success",
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Erro ao salvar gasto:",
      error,
    );


    setDialogStatus(
      elements,
      error?.message ||
      "Não foi possível salvar o gasto.",
      "error",
    );

  } finally {

    elements.saveItem.disabled =
      false;
  }
}


/* =========================================================
   ATUALIZAR
========================================================= */

async function refreshExpenses(
  elements,
) {
  try {

    setPageMessage(
      elements,
      "Atualizando gastos...",
      "loading",
    );


    await loadEvents(
      elements,
    );


    await loadExpenseItems();


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
      "[YXZ] Não foi possível carregar gastos:",
      error,
    );


    events =
      [];


    expenseItems =
      [];


    render(
      elements,
    );


    setPageMessage(
      elements,
      error?.message ||
      "Não foi possível carregar os gastos.",
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

      await refreshExpenses(
        elements,
      );
    },
  );


  elements.regional.addEventListener(
    "change",
    async () => {

      await refreshExpenses(
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


  elements.statusFilter.addEventListener(
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

      await refreshExpenses(
        elements,
      );
    },
  );


  elements.quantity.addEventListener(
    "input",
    () => {

      updateLineTotal(
        elements,
      );
    },
  );


  elements.unitValue.addEventListener(
    "input",
    () => {

      updateLineTotal(
        elements,
      );
    },
  );


  elements.itemForm.addEventListener(
    "submit",
    async (
      event,
    ) => {

      event.preventDefault();


      await saveExpenseItem(
        elements,
      );
    },
  );


  elements.cancelEdit.addEventListener(
    "click",
    () => {

      resetItemEditor(
        elements,
      );


      setDialogStatus(
        elements,
      );
    },
  );


  elements.closeButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          closeExpenseDialog(
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


      closeExpenseDialog(
        elements,
      );
    },
  );
}


/* =========================================================
   INIT
========================================================= */

export async function initGastosPage() {
  const elements =
    getElements();


  canManage =
    hasPermission(
      EXPENSE_MANAGE_PERMISSION,
    );


  elements.month.value =
    getCurrentMonth();


  bindEvents(
    elements,
  );


  try {

    setPageMessage(
      elements,
      "Carregando gastos...",
      "loading",
    );


    await Promise.all([
      loadRegionals(),
      loadSchools(),
      loadCategories(),
    ]);


    populateRegionalFilter(
      elements,
    );


    populateCategorySelect(
      elements,
    );


    await refreshExpenses(
      elements,
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Não foi possível iniciar Gastos:",
      error,
    );


    setPageMessage(
      elements,
      error?.message ||
      "Não foi possível carregar o módulo de Gastos.",
      "error",
    );
  }
}