import {
  supabase,
} from "./supabase.js";


let regionals =
  [];

let conference =
  null;

let rows =
  [];


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-conference-message]",
      ),

    month:
      document.querySelector(
        "[data-conference-month]",
      ),

    regional:
      document.querySelector(
        "[data-conference-regional]",
      ),

    search:
      document.querySelector(
        "[data-conference-search]",
      ),

    refresh:
      document.querySelector(
        "[data-conference-refresh]",
      ),

    statusPanel:
      document.querySelector(
        "[data-conference-status-panel]",
      ),

    status:
      document.querySelector(
        "[data-conference-status]",
      ),

    statusDescription:
      document.querySelector(
        "[data-conference-status-description]",
      ),

    hours:
      document.querySelector(
        "[data-conference-hours]",
      ),

    instructors:
      document.querySelector(
        "[data-conference-instructors]",
      ),

    events:
      document.querySelector(
        "[data-conference-events]",
      ),

    participations:
      document.querySelector(
        "[data-conference-participations]",
      ),

    divergences:
      document.querySelector(
        "[data-conference-divergences]",
      ),

    instructorBody:
      document.querySelector(
        "[data-conference-instructor-body]",
      ),

    detailBody:
      document.querySelector(
        "[data-conference-detail-body]",
      ),

    periodLabel:
      document.querySelector(
        "[data-conference-period-label]",
      ),

    empty:
      document.querySelector(
        "[data-conference-empty]",
      ),

    notes:
      document.querySelector(
        "[data-conference-notes]",
      ),

    close:
      document.querySelector(
        "[data-conference-close]",
      ),

    reopen:
      document.querySelector(
        "[data-conference-reopen]",
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


function getCompetenceDate(
  monthValue,
) {
  if (
    !/^\d{4}-\d{2}$/.test(
      monthValue,
    )
  ) {
    throw new Error(
      "Selecione uma competência válida.",
    );
  }


  return `${monthValue}-01`;
}


function getMonthLabel(
  monthValue,
) {
  const [
    year,
    month,
  ] =
    monthValue.split(
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


  const result =
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
    result.charAt(
      0,
    ).toUpperCase()
    +
    result.slice(
      1,
    )
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
  elements.regional
    .replaceChildren();


  const placeholder =
    document.createElement(
      "option",
    );


  placeholder.value =
    "";


  placeholder.textContent =
    "Selecione uma Regional";


  elements.regional.append(
    placeholder,
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


  const firstActive =
    regionals.find(
      (regional) =>
        regional.ativo,
    )
    ||
    regionals[0];


  if (
    firstActive
  ) {
    elements.regional.value =
      firstActive.id;
  }
}


/* =========================================================
   CONFERÊNCIA
========================================================= */

async function loadConference(
  elements,
) {
  const competence =
    getCompetenceDate(
      elements.month.value,
    );


  const regionalId =
    elements.regional.value;


  if (
    !regionalId
  ) {
    conference =
      null;


    return;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "conferencias_mensais",
      )
      .select(`
        id,
        competencia,
        regional_id,
        status,
        observacoes,
        fechado_at,
        reaberto_at,
        created_at,
        updated_at
      `)
      .eq(
        "competencia",
        competence,
      )
      .eq(
        "regional_id",
        regionalId,
      )
      .maybeSingle();


  if (
    error
  ) {
    throw error;
  }


  conference =
    data ||
    null;
}


/* =========================================================
   HORAS DA CONFERÊNCIA
========================================================= */

async function loadRows(
  elements,
) {
  const regionalId =
    elements.regional.value;


  if (
    !regionalId
  ) {
    rows =
      [];


    return;
  }


  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_monthly_conference_hours",
      {
        p_competencia:
          getCompetenceDate(
            elements.month.value,
          ),

        p_regional_id:
          regionalId,
      },
    );


  if (
    error
  ) {
    throw error;
  }


  rows =
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


  if (
    !search
  ) {
    return [
      ...rows,
    ];
  }


  return rows.filter(
    (row) => {

      const searchable =
        normalizeText(
          [
            row.instrutor_nome,
            row.atividade,
            row.escola_nome,
            row.regional_nome,
          ].join(
            " ",
          ),
        );


      return searchable.includes(
        search,
      );
    },
  );
}


/* =========================================================
   DIVERGÊNCIAS
========================================================= */

function isDivergence(
  row,
) {
  return [
    "alterado",
    "novo",
    "removido",
  ].includes(
    row.situacao,
  );
}


function getDivergenceCount(
  sourceRows = rows,
) {
  return sourceRows.filter(
    isDivergence,
  ).length;
}


/* =========================================================
   STATUS DA COMPETÊNCIA
========================================================= */

function renderConferenceStatus(
  elements,
) {
  const divergenceCount =
    getDivergenceCount();


  elements.statusPanel.className =
    "conference-status-panel";


  if (
    !conference
    ||
    conference.status ===
      "aberta"
  ) {

    elements.status.textContent =
      "Aberta";


    elements.statusDescription.textContent =
      "As horas ainda não foram fechadas para esta competência.";


    elements.statusPanel.classList.add(
      "conference-status-open",
    );


    elements.close.hidden =
      false;


    elements.reopen.hidden =
      true;


    elements.notes.placeholder =
      "Observação opcional para o fechamento.";


    return;
  }


  elements.close.hidden =
    true;


  elements.reopen.hidden =
    false;


  elements.notes.placeholder =
    "Informe o motivo para reabrir esta conferência.";


  if (
    divergenceCount >
    0
  ) {

    elements.status.textContent =
      "Fechada com divergências";


    elements.statusDescription.textContent =
      `${divergenceCount} lançamento(s) foram alterados após o fechamento.`;


    elements.statusPanel.classList.add(
      "conference-status-divergent",
    );


    return;
  }


  elements.status.textContent =
    "Fechada";


  const closedDate =
    conference.fechado_at
      ? new Date(
          conference.fechado_at,
        )
          .toLocaleString(
            "pt-BR",
          )
      : "";


  elements.statusDescription.textContent =
    closedDate
      ? `Conferência fechada em ${closedDate}. Nenhuma divergência encontrada.`
      : "Conferência fechada. Nenhuma divergência encontrada.";


  elements.statusPanel.classList.add(
    "conference-status-closed",
  );
}


/* =========================================================
   RESUMO
========================================================= */

function renderSummary(
  elements,
  sourceRows,
) {
  const currentRows =
    sourceRows.filter(
      (row) =>
        row.minutos_atuais !==
        null,
    );


  const totalMinutes =
    currentRows.reduce(
      (
        total,
        row,
      ) =>
        total +
        Number(
          row.minutos_atuais ||
          0,
        ),

      0,
    );


  const instructorIds =
    new Set(
      currentRows.map(
        (row) =>
          row.instrutor_id,
      ),
    );


  const eventIds =
    new Set(
      currentRows.map(
        (row) =>
          row.evento_id,
      ),
    );


  elements.hours.textContent =
    formatMinutes(
      totalMinutes,
    );


  elements.instructors.textContent =
    String(
      instructorIds.size,
    );


  elements.events.textContent =
    String(
      eventIds.size,
    );


  elements.participations.textContent =
    String(
      currentRows.length,
    );


  elements.divergences.textContent =
    String(
      getDivergenceCount(
        sourceRows,
      ),
    );
}


/* =========================================================
   RESUMO POR INSTRUTOR
========================================================= */

function getInstructorSummary(
  sourceRows,
) {
  const grouped =
    new Map();


  sourceRows.forEach(
    (row) => {

      if (
        !grouped.has(
          row.instrutor_id,
        )
      ) {

        grouped.set(
          row.instrutor_id,
          {
            id:
              row.instrutor_id,

            nome:
              row.instrutor_nome,

            rows:
              [],
          },
        );
      }


      grouped.get(
        row.instrutor_id,
      ).rows.push(
        row,
      );
    },
  );


  return Array.from(
    grouped.values(),
  )
    .map(
      (group) => {

        const currentRows =
          group.rows.filter(
            (row) =>
              row.minutos_atuais !==
              null,
          );


        const totalMinutes =
          currentRows.reduce(
            (
              total,
              row,
            ) =>
              total +
              Number(
                row.minutos_atuais ||
                0,
              ),

            0,
          );


        const eventIds =
          new Set(
            currentRows.map(
              (row) =>
                row.evento_id,
            ),
          );


        const divergent =
          group.rows.some(
            isDivergence,
          );


        return {
          id:
            group.id,

          nome:
            group.nome,

          participacoes:
            currentRows.length,

          eventos:
            eventIds.size,

          minutos:
            totalMinutes,

          divergent,
        };
      },
    )
    .sort(
      (
        a,
        b,
      ) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR",
        ),
    );
}


function renderInstructorSummary(
  elements,
  sourceRows,
) {
  const summary =
    getInstructorSummary(
      sourceRows,
    );


  elements.instructorBody
    .replaceChildren();


  summary.forEach(
    (item) => {

      const row =
        document.createElement(
          "tr",
        );


      const instructor =
        document.createElement(
          "td",
        );


      instructor.textContent =
        item.nome;


      const participations =
        document.createElement(
          "td",
        );


      participations.textContent =
        String(
          item.participacoes,
        );


      const events =
        document.createElement(
          "td",
        );


      events.textContent =
        String(
          item.eventos,
        );


      const hours =
        document.createElement(
          "td",
        );


      const hoursBadge =
        document.createElement(
          "strong",
        );


      hoursBadge.className =
        "conference-hours-badge";


      hoursBadge.textContent =
        formatMinutes(
          item.minutos,
        );


      hours.append(
        hoursBadge,
      );


      const status =
        document.createElement(
          "td",
        );


      const badge =
        document.createElement(
          "span",
        );


      if (
        !conference
        ||
        conference.status ===
          "aberta"
      ) {

        badge.className =
          "conference-badge conference-badge-open";


        badge.textContent =
          "Pendente";

      } else if (
        item.divergent
      ) {

        badge.className =
          "conference-badge conference-badge-divergent";


        badge.textContent =
          "Divergência";

      } else {

        badge.className =
          "conference-badge conference-badge-checked";


        badge.textContent =
          "Conferido";
      }


      status.append(
        badge,
      );


      row.append(
        instructor,
        participations,
        events,
        hours,
        status,
      );


      elements.instructorBody.append(
        row,
      );
    },
  );


  if (
    summary.length ===
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
      5;


    cell.className =
      "conference-loading";


    cell.textContent =
      "Nenhum instrutor encontrado.";


    row.append(
      cell,
    );


    elements.instructorBody.append(
      row,
    );
  }
}


/* =========================================================
   SITUAÇÃO
========================================================= */

function createSituationBadge(
  row,
) {
  const badge =
    document.createElement(
      "span",
    );


  const config = {
    aberta: {
      className:
        "conference-badge-open",

      label:
        "Pendente",
    },

    conferido: {
      className:
        "conference-badge-checked",

      label:
        "Conferido",
    },

    alterado: {
      className:
        "conference-badge-divergent",

      label:
        "Alterado",
    },

    novo: {
      className:
        "conference-badge-new",

      label:
        "Novo",
    },

    removido: {
      className:
        "conference-badge-removed",

      label:
        "Removido",
    },
  };


  const state =
    config[
      row.situacao
    ]
    ||
    config.aberta;


  badge.className =
    `conference-badge ${state.className}`;


  badge.textContent =
    state.label;


  return badge;
}


/* =========================================================
   TABELA DETALHADA
========================================================= */

function renderDetailTable(
  elements,
  sourceRows,
) {
  elements.detailBody
    .replaceChildren();


  elements.empty.hidden =
    sourceRows.length >
    0;


  sourceRows.forEach(
    (item) => {

      const row =
        document.createElement(
          "tr",
        );


      if (
        isDivergence(
          item,
        )
      ) {
        row.classList.add(
          "conference-row-divergent",
        );
      }


      const date =
        document.createElement(
          "td",
        );


      date.textContent =
        formatDateBR(
          item.data_real,
        );


      const instructor =
        document.createElement(
          "td",
        );


      instructor.textContent =
        item.instrutor_nome;


      const event =
        document.createElement(
          "td",
        );


      event.textContent =
        item.atividade;


      const school =
        document.createElement(
          "td",
        );


      school.textContent =
        item.escola_nome;


      const start =
        document.createElement(
          "td",
        );


      start.textContent =
        item.minutos_atuais ===
          null
          ? "—"
          : formatTime(
              item.hora_inicio_real,
            );


      const end =
        document.createElement(
          "td",
        );


      end.textContent =
        item.minutos_atuais ===
          null
          ? "—"
          : formatTime(
              item.hora_fim_real,
            );


      const hours =
        document.createElement(
          "td",
        );


      const wrapper =
        document.createElement(
          "div",
        );


      wrapper.className =
        "conference-hours-detail";


      const current =
        document.createElement(
          "strong",
        );


      current.textContent =
        item.minutos_atuais ===
          null
          ? "Removido"
          : formatMinutes(
              item.minutos_atuais,
            );


      wrapper.append(
        current,
      );


      if (
        item.minutos_conferidos !==
          null

        &&
        item.minutos_conferidos !==
          item.minutos_atuais
      ) {

        const previous =
          document.createElement(
            "small",
          );


        previous.textContent =
          `Conferido: ${formatMinutes(item.minutos_conferidos)}`;


        wrapper.append(
          previous,
        );
      }


      hours.append(
        wrapper,
      );


      const status =
        document.createElement(
          "td",
        );


      status.append(
        createSituationBadge(
          item,
        ),
      );


      row.append(
        date,
        instructor,
        event,
        school,
        start,
        end,
        hours,
        status,
      );


      elements.detailBody.append(
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
    getFilteredRows(
      elements,
    );


  elements.periodLabel.textContent =
    `${getMonthLabel(elements.month.value)} · ${
      elements.regional.selectedOptions?.[0]?.textContent || ""
    }`;


  renderConferenceStatus(
    elements,
  );


  renderSummary(
    elements,
    filtered,
  );


  renderInstructorSummary(
    elements,
    filtered,
  );


  renderDetailTable(
    elements,
    filtered,
  );
}


/* =========================================================
   ATUALIZAR
========================================================= */

async function refreshConference(
  elements,
) {
  const regionalId =
    elements.regional.value;


  if (
    !regionalId
  ) {

    conference =
      null;


    rows =
      [];


    render(
      elements,
    );


    setMessage(
      elements,
      "Selecione uma Regional.",
      "info",
    );


    return;
  }


  try {

    setMessage(
      elements,
      "Atualizando conferência...",
      "loading",
    );


    await loadConference(
      elements,
    );


    await loadRows(
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
      "[YXZ] Erro na conferência:",
      error,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar a conferência.",
      "error",
    );
  }
}


/* =========================================================
   FECHAR
========================================================= */

async function closeConference(
  elements,
) {
  if (
    !rows.some(
      (row) =>
        row.minutos_atuais !==
        null,
    )
  ) {

    setMessage(
      elements,
      "Não existem horas para fechar nesta competência.",
      "error",
    );


    return;
  }


  const confirmed =
    window.confirm(
      "Deseja fechar esta conferência? O sistema registrará um snapshot das horas atuais.",
    );


  if (
    !confirmed
  ) {
    return;
  }


  elements.close.disabled =
    true;


  elements.reopen.disabled =
    true;


  try {

    setMessage(
      elements,
      "Fechando conferência...",
      "loading",
    );


    const {
      error,
    } =
      await supabase.rpc(
        "close_monthly_conference",
        {
          p_competencia:
            getCompetenceDate(
              elements.month.value,
            ),

          p_regional_id:
            elements.regional.value,

          p_observacoes:
            elements.notes.value
              .trim() ||
            null,
        },
      );


    if (
      error
    ) {
      throw error;
    }


    elements.notes.value =
      "";


    await refreshConference(
      elements,
    );


    setMessage(
      elements,
      "Conferência fechada com sucesso.",
      "success",
    );

  } catch (
    error
  ) {

    setMessage(
      elements,
      error?.message ||
      "Não foi possível fechar a conferência.",
      "error",
    );

  } finally {

    elements.close.disabled =
      false;


    elements.reopen.disabled =
      false;
  }
}


/* =========================================================
   REABRIR
========================================================= */

async function reopenConference(
  elements,
) {
  const reason =
    elements.notes.value
      .trim();


  if (
    !reason
  ) {

    setMessage(
      elements,
      "Informe o motivo da reabertura.",
      "error",
    );


    elements.notes.focus();


    return;
  }


  const confirmed =
    window.confirm(
      "Deseja reabrir esta conferência? Depois das correções será necessário fechá-la novamente.",
    );


  if (
    !confirmed
  ) {
    return;
  }


  elements.close.disabled =
    true;


  elements.reopen.disabled =
    true;


  try {

    setMessage(
      elements,
      "Reabrindo conferência...",
      "loading",
    );


    const {
      error,
    } =
      await supabase.rpc(
        "reopen_monthly_conference",
        {
          p_competencia:
            getCompetenceDate(
              elements.month.value,
            ),

          p_regional_id:
            elements.regional.value,

          p_observacoes:
            reason,
        },
      );


    if (
      error
    ) {
      throw error;
    }


    elements.notes.value =
      "";


    await refreshConference(
      elements,
    );


    setMessage(
      elements,
      "Conferência reaberta com sucesso.",
      "success",
    );

  } catch (
    error
  ) {

    setMessage(
      elements,
      error?.message ||
      "Não foi possível reabrir a conferência.",
      "error",
    );

  } finally {

    elements.close.disabled =
      false;


    elements.reopen.disabled =
      false;
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

      await refreshConference(
        elements,
      );
    },
  );


  elements.regional.addEventListener(
    "change",
    async () => {

      await refreshConference(
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

      await refreshConference(
        elements,
      );
    },
  );


  elements.close.addEventListener(
    "click",
    async () => {

      await closeConference(
        elements,
      );
    },
  );


  elements.reopen.addEventListener(
    "click",
    async () => {

      await reopenConference(
        elements,
      );
    },
  );
}


/* =========================================================
   INIT
========================================================= */

export async function initConferenciaPage() {
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
      "Carregando conferência...",
      "loading",
    );


    await loadRegionals();


    populateRegionals(
      elements,
    );


    await refreshConference(
      elements,
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Não foi possível iniciar Conferência:",
      error,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar a Conferência.",
      "error",
    );
  }
}