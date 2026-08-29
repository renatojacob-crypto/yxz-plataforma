import {
  supabase,
} from "./supabase.js";


const EVENT_STATUS = {
  SCHEDULED:
    "agendada",

  COMPLETED:
    "realizada",

  CANCELLED:
    "cancelada",
};


let regionals =
  [];

let schools =
  [];

let upcomingEvents =
  [];

let monthEvents =
  [];

let hourRows =
  [];

let expenseItems =
  [];


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-dashboard-message]",
      ),

    scheduled:
      document.querySelector(
        "[data-dashboard-scheduled]",
      ),

    realized:
      document.querySelector(
        "[data-dashboard-realized]",
      ),

    hours:
      document.querySelector(
        "[data-dashboard-hours]",
      ),

    expenses:
      document.querySelector(
        "[data-dashboard-expenses]",
      ),

    upcoming:
      document.querySelector(
        "[data-dashboard-upcoming]",
      ),

    upcomingEmpty:
      document.querySelector(
        "[data-dashboard-upcoming-empty]",
      ),

    nextSeven:
      document.querySelector(
        "[data-dashboard-next-seven]",
      ),

    cancelled:
      document.querySelector(
        "[data-dashboard-cancelled]",
      ),

    participants:
      document.querySelector(
        "[data-dashboard-participants]",
      ),

    missingParticipants:
      document.querySelector(
        "[data-dashboard-missing-participants]",
      ),
  };
}


/* =========================================================
   DATAS
========================================================= */

function formatIsoDate(
  date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
      1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );


  return `${year}-${month}-${day}`;
}


function addDays(
  date,
  days,
) {
  const result =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );


  result.setDate(
    result.getDate() +
    days,
  );


  return result;
}


function getCurrentMonthPeriod() {
  const now =
    new Date();


  return {
    start:
      formatIsoDate(
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        ),
      ),

    end:
      formatIsoDate(
        new Date(
          now.getFullYear(),
          now.getMonth() +
          1,
          0,
        ),
      ),
  };
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


/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatMinutes(
  value,
) {
  const minutes =
    Number(
      value ||
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


function setMessage(
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


/* =========================================================
   DADOS AUXILIARES
========================================================= */

function getRegional(
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


function getSchool(
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


/* =========================================================
   CARREGAMENTO
========================================================= */

async function loadBaseData() {
  const [
    regionalResult,
    schoolResult,
  ] =
    await Promise.all([
      supabase
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
        ),

      supabase
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
        ),
    ]);


  if (
    regionalResult.error
  ) {
    throw regionalResult.error;
  }


  if (
    schoolResult.error
  ) {
    throw schoolResult.error;
  }


  regionals =
    regionalResult.data ||
    [];

  schools =
    schoolResult.data ||
    [];
}


async function loadEvents() {
  const now =
    new Date();

  const today =
    formatIsoDate(
      now,
    );

  const nextThirty =
    formatIsoDate(
      addDays(
        now,
        30,
      ),
    );

  const period =
    getCurrentMonthPeriod();


  const [
    upcomingResult,
    monthResult,
  ] =
    await Promise.all([
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
          participantes_previstos,
          status
        `)
        .eq(
          "status",
          EVENT_STATUS.SCHEDULED,
        )
        .gte(
          "data",
          today,
        )
        .lte(
          "data",
          nextThirty,
        )
        .order(
          "data",
        )
        .order(
          "hora_inicio",
        ),

      supabase
        .from(
          "oficinas",
        )
        .select(`
          id,
          regional_id,
          escola_id,
          atividade,
          data,
          hora_inicio,
          participantes_previstos,
          status
        `)
        .gte(
          "data",
          period.start,
        )
        .lte(
          "data",
          period.end,
        ),
    ]);


  if (
    upcomingResult.error
  ) {
    throw upcomingResult.error;
  }


  if (
    monthResult.error
  ) {
    throw monthResult.error;
  }


  upcomingEvents =
    upcomingResult.data ||
    [];

  monthEvents =
    monthResult.data ||
    [];
}


async function loadHours() {
  const period =
    getCurrentMonthPeriod();


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
          null,

        p_instrutor_id:
          null,
      },
    );


  if (error) {
    throw error;
  }


  hourRows =
    data ||
    [];
}


async function loadExpenses() {
  const eventIds =
    monthEvents.map(
      (event) =>
        event.id,
    );


  if (
    !eventIds.length
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
        quantidade,
        valor_unitario
      `)
      .in(
        "evento_id",
        eventIds,
      );


  if (error) {
    throw error;
  }


  expenseItems =
    data ||
    [];
}


/* =========================================================
   PRÓXIMOS EVENTOS
========================================================= */

function createUpcomingItem(
  event,
) {
  const regional =
    getRegional(
      event.regional_id,
    );

  const school =
    getSchool(
      event.escola_id,
    );


  const item =
    document.createElement(
      "article",
    );

  item.className =
    "dashboard-upcoming-item";


  const date =
    document.createElement(
      "div",
    );

  date.className =
    "dashboard-upcoming-date";


  const dateStrong =
    document.createElement(
      "strong",
    );

  dateStrong.textContent =
    formatDateBR(
      event.data,
    );


  const time =
    document.createElement(
      "span",
    );

  time.textContent =
    formatTime(
      event.hora_inicio,
    ) ||
    "—";


  date.append(
    dateStrong,
    time,
  );


  const content =
    document.createElement(
      "div",
    );

  content.className =
    "dashboard-upcoming-content";


  const title =
    document.createElement(
      "strong",
    );

  title.textContent =
    event.atividade ||
    "Evento YXZ";


  const schoolText =
    document.createElement(
      "span",
    );

  schoolText.textContent =
    school?.nome ||
    "Escola não informada";


  const regionalText =
    document.createElement(
      "small",
    );

  regionalText.textContent =
    regional?.nome ||
    "Regional não informada";


  content.append(
    title,
    schoolText,
    regionalText,
  );


  item.append(
    date,
    content,
  );


  return item;
}


function renderUpcoming(
  elements,
) {
  elements.upcoming
    ?.replaceChildren();


  const rows =
    upcomingEvents.slice(
      0,
      8,
    );


  if (
    elements.upcomingEmpty
  ) {
    elements.upcomingEmpty.hidden =
      rows.length >
      0;
  }


  rows.forEach(
    (event) => {
      elements.upcoming
        ?.append(
          createUpcomingItem(
            event,
          ),
        );
    },
  );
}


/* =========================================================
   RESUMO
========================================================= */

function renderSummary(
  elements,
) {
  const now =
    new Date();

  const nextSevenDate =
    formatIsoDate(
      addDays(
        now,
        7,
      ),
    );


  const scheduled =
    upcomingEvents.length;


  const realized =
    monthEvents.filter(
      (event) =>
        event.status ===
        EVENT_STATUS.COMPLETED,
    ).length;


  const cancelled =
    monthEvents.filter(
      (event) =>
        event.status ===
        EVENT_STATUS.CANCELLED,
    ).length;


  const participants =
    monthEvents.reduce(
      (
        total,
        event,
      ) =>
        total +
        Number(
          event.participantes_previstos ||
          0,
        ),
      0,
    );


  const missingParticipants =
    monthEvents.filter(
      (event) =>
        event.status !==
          EVENT_STATUS.CANCELLED
        &&
        (
          event.participantes_previstos ===
            null
          ||
          Number(
            event.participantes_previstos,
          ) <=
            0
        ),
    ).length;


  const nextSeven =
    upcomingEvents.filter(
      (event) =>
        event.data <=
        nextSevenDate,
    ).length;


  const totalMinutes =
    hourRows.reduce(
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


  const totalExpenses =
    expenseItems.reduce(
      (
        total,
        item,
      ) =>
        total +
        (
          Number(
            item.quantidade ||
            0,
          )
          *
          Number(
            item.valor_unitario ||
            0,
          )
        ),
      0,
    );


  elements.scheduled.textContent =
    String(
      scheduled,
    );

  elements.realized.textContent =
    String(
      realized,
    );

  elements.hours.textContent =
    formatMinutes(
      totalMinutes,
    );

  elements.expenses.textContent =
    formatCurrency(
      totalExpenses,
    );

  elements.nextSeven.textContent =
    String(
      nextSeven,
    );

  elements.cancelled.textContent =
    String(
      cancelled,
    );

  elements.participants.textContent =
    String(
      participants,
    );

  elements.missingParticipants.textContent =
    String(
      missingParticipants,
    );
}


/* =========================================================
   INIT
========================================================= */

export async function initDashboardPage() {
  const elements =
    getElements();


  try {
    setMessage(
      elements,
      "Atualizando indicadores...",
      "loading",
    );


    await Promise.all([
      loadBaseData(),
      loadEvents(),
    ]);


    await Promise.all([
      loadHours(),
      loadExpenses(),
    ]);


    renderSummary(
      elements,
    );

    renderUpcoming(
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
      "[YXZ] Não foi possível carregar o dashboard:",
      error,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar os indicadores do dashboard.",
      "error",
    );
  }
}
