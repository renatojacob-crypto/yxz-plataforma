import {
  supabase,
} from "./supabase.js";


const STATUS_LABELS = {
  agendada:
    "Agendado",

  realizada:
    "Realizado",

  cancelada:
    "Cancelado",
};


const TYPE_LABELS = {
  oficina_educacional:
    "Oficina Educacional",

  evento_comunidade:
    "Evento à Comunidade",
};


let regionals =
  [];

let schools =
  [];

let events =
  [];

let visibleMonth =
  new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-calendar-message]",
      ),

    title:
      document.querySelector(
        "[data-calendar-title]",
      ),

    grid:
      document.querySelector(
        "[data-calendar-grid]",
      ),

    previous:
      document.querySelector(
        "[data-calendar-prev]",
      ),

    next:
      document.querySelector(
        "[data-calendar-next]",
      ),

    today:
      document.querySelector(
        "[data-calendar-today]",
      ),

    regional:
      document.querySelector(
        "[data-calendar-regional]",
      ),

    type:
      document.querySelector(
        "[data-calendar-type]",
      ),

    status:
      document.querySelector(
        "[data-calendar-status]",
      ),

    activityLegend:
      document.querySelector(
        "[data-calendar-activity-legend]",
      ),

    dialog:
      document.getElementById(
        "calendarEventDialog",
      ),

    dialogTitle:
      document.querySelector(
        "[data-calendar-dialog-title]",
      ),

    dialogDate:
      document.querySelector(
        "[data-calendar-dialog-date]",
      ),

    dialogTime:
      document.querySelector(
        "[data-calendar-dialog-time]",
      ),

    dialogRegional:
      document.querySelector(
        "[data-calendar-dialog-regional]",
      ),

    dialogSchool:
      document.querySelector(
        "[data-calendar-dialog-school]",
      ),

    dialogType:
      document.querySelector(
        "[data-calendar-dialog-type]",
      ),

    dialogStatus:
      document.querySelector(
        "[data-calendar-dialog-status]",
      ),

    dialogParticipants:
      document.querySelector(
        "[data-calendar-dialog-participants]",
      ),

    dialogClose:
      document.querySelectorAll(
        "[data-calendar-dialog-close]",
      ),
  };
}


/* =========================================================
   UTILIDADES
========================================================= */

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


function getMonthPeriod() {
  return {
    start:
      formatIsoDate(
        new Date(
          visibleMonth.getFullYear(),
          visibleMonth.getMonth(),
          1,
        ),
      ),

    end:
      formatIsoDate(
        new Date(
          visibleMonth.getFullYear(),
          visibleMonth.getMonth() +
          1,
          0,
        ),
      ),
  };
}


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


function getActivityName(
  event,
) {
  return (
    String(
      event?.atividade ||
      "",
    ).trim()
    ||
    "Atividade não informada"
  );
}


function hashText(
  value,
) {
  const text =
    String(
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
      .toLowerCase();


  let hash =
    0;


  for (
    let index =
      0;
    index <
      text.length;
    index +=
      1
  ) {
    hash =
      (
        (
          hash <<
          5
        )
        -
        hash
      )
      +
      text.charCodeAt(
        index,
      );


    hash |=
      0;
  }


  return Math.abs(
    hash,
  );
}


function getActivityColor(
  activity,
) {
  const hue =
    hashText(
      activity,
    ) %
    360;


  return {
    border:
      `hsl(${hue} 58% 38%)`,

    background:
      `hsl(${hue} 64% 94%)`,

    text:
      `hsl(${hue} 54% 27%)`,

    strongBackground:
      `hsl(${hue} 60% 84%)`,
  };
}


function applyActivityColors(
  element,
  activity,
) {
  const colors =
    getActivityColor(
      activity,
    );


  element.style.setProperty(
    "--calendar-activity-border",
    colors.border,
  );

  element.style.setProperty(
    "--calendar-activity-background",
    colors.background,
  );

  element.style.setProperty(
    "--calendar-activity-text",
    colors.text,
  );

  element.style.setProperty(
    "--calendar-activity-strong-background",
    colors.strongBackground,
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
  const period =
    getMonthPeriod();


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


  if (error) {
    throw error;
  }


  events =
    data ||
    [];
}


/* =========================================================
   FILTROS
========================================================= */

function populateRegionals(
  elements,
) {
  const current =
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


  regionals
    .filter(
      (regional) =>
        regional.ativo !==
        false,
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
        current,
    )
  ) {
    elements.regional.value =
      current;
  }
}


function getFilteredEvents(
  elements,
) {
  const regional =
    elements.regional.value;

  const type =
    elements.type.value;

  const status =
    elements.status.value;


  return events.filter(
    (event) =>
      (
        !regional
        ||
        event.regional_id ===
          regional
      )
      &&
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
      ),
  );
}


/* =========================================================
   DIALOG
========================================================= */

function openEventDialog(
  event,
  elements,
) {
  if (
    !elements.dialog
  ) {
    return;
  }


  const regional =
    getRegional(
      event.regional_id,
    );

  const school =
    getSchool(
      event.escola_id,
    );


  elements.dialogTitle.textContent =
    event.atividade ||
    "Evento YXZ";

  elements.dialogDate.textContent =
    formatDateBR(
      event.data,
    );

  elements.dialogTime.textContent =
    `${formatTime(event.hora_inicio) || "—"} até ${formatTime(event.hora_fim) || "—"}`;

  elements.dialogRegional.textContent =
    regional?.nome ||
    "—";

  elements.dialogSchool.textContent =
    school?.nome ||
    "—";

  elements.dialogType.textContent =
    TYPE_LABELS[
      event.tipo_evento
    ] ||
    event.tipo_evento ||
    "—";

  elements.dialogStatus.textContent =
    STATUS_LABELS[
      event.status
    ] ||
    event.status ||
    "—";

  elements.dialogParticipants.textContent =
    event.participantes_previstos ??
    "—";


  elements.dialog.showModal();
}


/* =========================================================
   EVENTO NO DIA
========================================================= */

function createEventButton(
  event,
  elements,
) {
  const button =
    document.createElement(
      "button",
    );


  button.type =
    "button";

  const activity =
    getActivityName(
      event,
    );


  const statusClass =
    `calendar-event-status-${event.status || "agendada"}`;


  button.className =
    [
      "calendar-event",
      statusClass,
    ].join(
      " ",
    );


  applyActivityColors(
    button,
    activity,
  );


  const time =
    document.createElement(
      "span",
    );

  time.className =
    "calendar-event-time";

  time.textContent =
    formatTime(
      event.hora_inicio,
    ) ||
    "—";


  const title =
    document.createElement(
      "span",
    );

  title.className =
    "calendar-event-title";

  title.textContent =
    activity;


  const statusMarker =
    document.createElement(
      "span",
    );

  statusMarker.className =
    `calendar-event-status-dot status-${event.status || "agendada"}`;

  statusMarker.setAttribute(
    "aria-hidden",
    "true",
  );


  button.append(
    statusMarker,
    time,
    title,
  );


  button.title =
    [
      TYPE_LABELS[
        event.tipo_evento
      ] ||
      "Evento",

      STATUS_LABELS[
        event.status
      ] ||
      event.status ||
      "Sem status",

      time.textContent,
      title.textContent,
    ].join(
      " · ",
    );


  button.addEventListener(
    "click",
    () => {
      openEventDialog(
        event,
        elements,
      );
    },
  );


  return button;
}


/* =========================================================
   LEGENDA DE ATIVIDADES
========================================================= */

function renderActivityLegend(
  elements,
  filteredEvents,
) {
  if (
    !elements.activityLegend
  ) {
    return;
  }


  elements.activityLegend
    .replaceChildren();


  const activities =
    Array.from(
      new Set(
        filteredEvents.map(
          (event) =>
            getActivityName(
              event,
            ),
        ),
      ),
    ).sort(
      (
        a,
        b,
      ) =>
        a.localeCompare(
          b,
          "pt-BR",
          {
            sensitivity:
              "base",
          },
        ),
    );


  if (
    !activities.length
  ) {
    const empty =
      document.createElement(
        "span",
      );


    empty.className =
      "calendar-legend-empty";

    empty.textContent =
      "Nenhuma atividade no período";


    elements.activityLegend
      .append(
        empty,
      );


    return;
  }


  activities.forEach(
    (activity) => {
      const item =
        document.createElement(
          "span",
        );


      item.className =
        "calendar-activity-legend-item";


      const swatch =
        document.createElement(
          "i",
        );


      swatch.className =
        "calendar-activity-swatch";


      applyActivityColors(
        swatch,
        activity,
      );


      const label =
        document.createElement(
          "span",
        );


      label.textContent =
        activity;


      item.append(
        swatch,
        label,
      );


      elements.activityLegend
        .append(
          item,
        );
    },
  );
}


/* =========================================================
   CALENDÁRIO
========================================================= */

function createDayCell(
  date,
  {
    outside = false,
  } = {},
) {
  const cell =
    document.createElement(
      "div",
    );


  cell.className =
    "calendar-day";


  if (outside) {
    cell.classList.add(
      "calendar-day-outside",
    );
  }


  const today =
    formatIsoDate(
      new Date(),
    );


  if (
    formatIsoDate(
      date,
    ) ===
    today
  ) {
    cell.classList.add(
      "calendar-day-today",
    );
  }


  const header =
    document.createElement(
      "div",
    );

  header.className =
    "calendar-day-header";


  const number =
    document.createElement(
      "span",
    );

  number.className =
    "calendar-day-number";

  number.textContent =
    String(
      date.getDate(),
    );


  header.append(
    number,
  );


  const content =
    document.createElement(
      "div",
    );

  content.className =
    "calendar-day-events";


  cell.append(
    header,
    content,
  );


  return {
    cell,
    content,
  };
}


function renderCalendar(
  elements,
) {
  const filtered =
    getFilteredEvents(
      elements,
    );


  renderActivityLegend(
    elements,
    filtered,
  );


  const monthLabel =
    visibleMonth.toLocaleDateString(
      "pt-BR",
      {
        month:
          "long",

        year:
          "numeric",
      },
    );


  elements.title.textContent =
    monthLabel.charAt(
      0,
    ).toUpperCase()
    +
    monthLabel.slice(
      1,
    );


  elements.grid
    .replaceChildren();


  const firstDay =
    new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1,
    );


  const gridStart =
    new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1 -
      firstDay.getDay(),
    );


  for (
    let index =
      0;
    index <
      42;
    index +=
      1
  ) {
    const date =
      new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() +
        index,
      );


    const outside =
      date.getMonth() !==
      visibleMonth.getMonth();


    const {
      cell,
      content,
    } =
      createDayCell(
        date,
        {
          outside,
        },
      );


    const iso =
      formatIsoDate(
        date,
      );


    filtered
      .filter(
        (event) =>
          event.data ===
          iso,
      )
      .forEach(
        (event) => {
          content.append(
            createEventButton(
              event,
              elements,
            ),
          );
        },
      );


    elements.grid.append(
      cell,
    );
  }
}


/* =========================================================
   ATUALIZAÇÃO DO MÊS
========================================================= */

async function refreshCalendar(
  elements,
) {
  try {
    setMessage(
      elements,
      "Atualizando calendário...",
      "loading",
    );


    await loadEvents();


    renderCalendar(
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
      "[YXZ] Não foi possível carregar o calendário:",
      error,
    );


    events =
      [];


    renderCalendar(
      elements,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar os eventos do calendário.",
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
  elements.previous
    .addEventListener(
      "click",
      async () => {
        visibleMonth =
          new Date(
            visibleMonth.getFullYear(),
            visibleMonth.getMonth() -
            1,
            1,
          );


        await refreshCalendar(
          elements,
        );
      },
    );


  elements.next
    .addEventListener(
      "click",
      async () => {
        visibleMonth =
          new Date(
            visibleMonth.getFullYear(),
            visibleMonth.getMonth() +
            1,
            1,
          );


        await refreshCalendar(
          elements,
        );
      },
    );


  elements.today
    .addEventListener(
      "click",
      async () => {
        const now =
          new Date();


        visibleMonth =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
          );


        await refreshCalendar(
          elements,
        );
      },
    );


  [
    elements.regional,
    elements.type,
    elements.status,
  ].forEach(
    (control) => {
      control.addEventListener(
        "change",
        () => {
          renderCalendar(
            elements,
          );
        },
      );
    },
  );


  elements.dialogClose
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            elements.dialog
              ?.close();
          },
        );
      },
    );
}


/* =========================================================
   INIT
========================================================= */

export async function initCalendarioPage() {
  const elements =
    getElements();


  bindEvents(
    elements,
  );


  try {
    setMessage(
      elements,
      "Carregando calendário...",
      "loading",
    );


    await loadBaseData();


    populateRegionals(
      elements,
    );


    await refreshCalendar(
      elements,
    );

  } catch (
    error
  ) {
    console.error(
      "[YXZ] Não foi possível inicializar o calendário:",
      error,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível inicializar o calendário.",
      "error",
    );
  }
}
