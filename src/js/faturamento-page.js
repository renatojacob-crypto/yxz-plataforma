import {
  supabase,
} from "./supabase.js";


const EVENT_TYPE_LABELS = {
  oficina_educacional:
    "Oficina Educacional",

  evento_comunidade:
    "Evento à Comunidade",
};


let regionals = [];
let models = [];
let billingItems = [];
let mappings = [];
let activities = [];
let previewRows = [];

let selectedActivity =
  null;


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-billing-message]",
      ),

    month:
      document.querySelector(
        "[data-billing-month]",
      ),

    regional:
      document.querySelector(
        "[data-billing-regional]",
      ),

    period:
      document.querySelector(
        "[data-billing-period]",
      ),

    refresh:
      document.querySelector(
        "[data-billing-refresh]",
      ),

    generate:
      document.querySelector(
        "[data-billing-generate]",
      ),

    total:
      document.querySelector(
        "[data-billing-total]",
      ),

    mapped:
      document.querySelector(
        "[data-billing-mapped]",
      ),

    ready:
      document.querySelector(
        "[data-billing-ready]",
      ),

    pending:
      document.querySelector(
        "[data-billing-pending]",
      ),

    unmapped:
      document.querySelector(
        "[data-billing-unmapped]",
      ),

    modelGrid:
      document.querySelector(
        "[data-billing-model-grid]",
      ),

    mappingStatus:
      document.querySelector(
        "[data-billing-mapping-status]",
      ),

    mappingBody:
      document.querySelector(
        "[data-billing-mapping-body]",
      ),

    mappingEmpty:
      document.querySelector(
        "[data-billing-mapping-empty]",
      ),

    previewBody:
      document.querySelector(
        "[data-billing-preview-body]",
      ),

    previewEmpty:
      document.querySelector(
        "[data-billing-preview-empty]",
      ),

    dialog:
      document.getElementById(
        "billingMappingDialog",
      ),

    dialogForm:
      document.getElementById(
        "billingMappingForm",
      ),

    dialogRegional:
      document.querySelector(
        "[data-billing-dialog-regional]",
      ),

    dialogType:
      document.querySelector(
        "[data-billing-dialog-type]",
      ),

    dialogActivity:
      document.querySelector(
        "[data-billing-dialog-activity]",
      ),

    dialogDestination:
      document.querySelector(
        "[data-billing-dialog-destination]",
      ),

    dialogStatus:
      document.querySelector(
        "[data-billing-dialog-status]",
      ),

    dialogSave:
      document.querySelector(
        "[data-billing-dialog-save]",
      ),

    dialogCloseButtons:
      document.querySelectorAll(
        "[data-billing-dialog-close]",
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
    String(
      value,
    ).split(
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


  if (!minutes) {
    return "0h";
  }


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


function formatIsoDate(
  date,
) {
  const year =
    date.getUTCFullYear();


  const month =
    String(
      date.getUTCMonth() +
      1,
    ).padStart(
      2,
      "0",
    );


  const day =
    String(
      date.getUTCDate(),
    ).padStart(
      2,
      "0",
    );


  return `${year}-${month}-${day}`;
}


function getBillingPeriod(
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


  const monthIndex =
    month -
    1;


  const start =
    new Date(
      Date.UTC(
        year,
        monthIndex -
        1,
        21,
      ),
    );


  const end =
    new Date(
      Date.UTC(
        year,
        monthIndex,
        20,
      ),
    );


  return {
    start:
      formatIsoDate(
        start,
      ),

    end:
      formatIsoDate(
        end,
      ),

    competence:
      `${yearText}-${monthText}-01`,
  };
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


function setDialogStatus(
  elements,
  message = "",
  state = "",
) {
  elements.dialogStatus.textContent =
    message;


  elements.dialogStatus.dataset.state =
    state;
}


function getRegionalById(
  id,
) {
  return (
    regionals.find(
      (regional) =>
        regional.id ===
        id,
    ) ||
    null
  );
}


function getModelByCode(
  code,
) {
  return (
    models.find(
      (model) =>
        model.codigo ===
        code,
    ) ||
    null
  );
}


function getItem(
  modelCode,
  itemCode,
) {
  return (
    billingItems.find(
      (item) =>
        item.modelo_codigo ===
          modelCode

        &&
        item.codigo ===
          itemCode,
    ) ||
    null
  );
}


function getActivityKey(
  activity,
) {
  return [
    activity.regional_id,
    activity.tipo_evento,
    activity.atividade,
  ].join(
    "|||",
  );
}


function getMappingForActivity(
  activity,
) {
  return (
    mappings.find(
      (mapping) =>
        mapping.regional_id ===
          activity.regional_id

        &&
        mapping.tipo_evento ===
          activity.tipo_evento

        &&
        mapping.atividade ===
          activity.atividade

        &&
        mapping.ativo !==
          false,
    ) ||
    null
  );
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
      );


  if (error) {
    throw error;
  }


  regionals =
    data ||
    [];
}


async function loadModels() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "faturamento_modelos",
      )
      .select(`
        codigo,
        nome,
        tipo_arquivo,
        regional_id,
        contrato,
        responsavel_contrato,
        nome_template,
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


  if (error) {
    throw error;
  }


  models =
    data ||
    [];
}


async function loadBillingItems() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "faturamento_itens",
      )
      .select(`
        modelo_codigo,
        codigo,
        nome,
        kits_por_oficina,
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


  if (error) {
    throw error;
  }


  billingItems =
    data ||
    [];
}


async function loadMappings() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "faturamento_atividade_mapeamentos",
      )
      .select(`
        id,
        regional_id,
        tipo_evento,
        atividade,
        modelo_codigo,
        item_codigo,
        ativo,
        updated_at
      `);


  if (error) {
    throw error;
  }


  mappings =
    data ||
    [];
}


async function loadActivities() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "oficinas",
      )
      .select(`
        regional_id,
        tipo_evento,
        atividade
      `)
      .not(
        "atividade",
        "is",
        null,
      );


  if (error) {
    throw error;
  }


  const unique =
    new Map();


  (
    data ||
    []
  ).forEach(
    (row) => {

      const activity = {
        regional_id:
          row.regional_id,

        tipo_evento:
          row.tipo_evento,

        atividade:
          String(
            row.atividade ||
            "",
          ).trim(),
      };


      if (
        !activity.atividade
      ) {
        return;
      }


      unique.set(
        getActivityKey(
          activity,
        ),
        activity,
      );
    },
  );


  activities =
    Array.from(
      unique.values(),
    ).sort(
      (
        a,
        b,
      ) => {

        const regionalA =
          getRegionalById(
            a.regional_id,
          )?.ordem ||
          999;


        const regionalB =
          getRegionalById(
            b.regional_id,
          )?.ordem ||
          999;


        if (
          regionalA !==
          regionalB
        ) {
          return (
            regionalA -
            regionalB
          );
        }


        return a.atividade
          .localeCompare(
            b.atividade,
            "pt-BR",
          );
      },
    );
}


async function loadPreview(
  elements,
) {
  const period =
    getBillingPeriod(
      elements.month.value,
    );


  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_monthly_billing_preview",
      {
        p_competencia:
          period.competence,

        p_regional_id:
          elements.regional.value ||
          null,
      },
    );


  if (error) {
    throw error;
  }


  previewRows =
    data ||
    [];
}


/* =========================================================
   REGIONAIS
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


/* =========================================================
   RESUMO
========================================================= */

function renderPeriod(
  elements,
) {
  const period =
    getBillingPeriod(
      elements.month.value,
    );


  elements.period.textContent =
    `${formatDateBR(period.start)} a ${formatDateBR(period.end)}`;
}


function renderSummary(
  elements,
) {
  const mappedRows =
    previewRows.filter(
      (row) =>
        Boolean(
          row.modelo_codigo,
        ),
    );


  const readyRows =
    mappedRows.filter(
      (row) =>
        row.completo ===
        true,
    );


  const pendingRows =
    mappedRows.filter(
      (row) =>
        row.completo !==
        true,
    );


  const unmappedRows =
    previewRows.filter(
      (row) =>
        !row.modelo_codigo,
    );


  elements.total.textContent =
    String(
      previewRows.length,
    );


  elements.mapped.textContent =
    String(
      mappedRows.length,
    );


  elements.ready.textContent =
    String(
      readyRows.length,
    );


  elements.pending.textContent =
    String(
      pendingRows.length,
    );


  elements.unmapped.textContent =
    String(
      unmappedRows.length,
    );
}


/* =========================================================
   MODELOS
========================================================= */

function createModelMetric(
  labelText,
  valueText,
) {
  const wrapper =
    document.createElement(
      "div",
    );


  wrapper.className =
    "billing-model-metric";


  const label =
    document.createElement(
      "span",
    );


  label.textContent =
    labelText;


  const value =
    document.createElement(
      "strong",
    );


  value.textContent =
    valueText;


  wrapper.append(
    label,
    value,
  );


  return wrapper;
}


function renderModels(
  elements,
) {
  elements.modelGrid
    .replaceChildren();


  const selectedRegional =
    elements.regional.value;


  const visibleModels =
    models.filter(
      (model) =>
        !selectedRegional

        ||
        model.regional_id ===
          selectedRegional,
    );


  visibleModels.forEach(
    (model) => {

      const rows =
        previewRows.filter(
          (row) =>
            row.modelo_codigo ===
            model.codigo,
        );


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


      const totalMinutes =
        rows.reduce(
          (
            total,
            row,
          ) =>
            total +
            Number(
              row.minutos_evento ||
              0,
            ),

          0,
        );


      const kitTotal =
        rows.reduce(
          (
            total,
            row,
          ) =>
            total +
            Number(
              row.kits_total ||
              0,
            ),

          0,
        );


      const pending =
        rows.filter(
          (row) =>
            row.completo !==
            true,
        ).length;


      const card =
        document.createElement(
          "article",
        );


      card.className =
        "card billing-model-card";


      const header =
        document.createElement(
          "div",
        );


      header.className =
        "billing-model-card-header";


      const titleGroup =
        document.createElement(
          "div",
        );


      const title =
        document.createElement(
          "h3",
        );


      title.textContent =
        model.nome;


      const meta =
        document.createElement(
          "span",
        );


      meta.textContent =
        `Contrato ${model.contrato} · ${String(model.tipo_arquivo).toUpperCase()}`;


      titleGroup.append(
        title,
        meta,
      );


      const status =
        document.createElement(
          "span",
        );


      status.className =
        pending > 0
          ? "billing-model-status billing-model-status-warning"
          : rows.length > 0
            ? "billing-model-status billing-model-status-ready"
            : "billing-model-status billing-model-status-empty";


      status.textContent =
        pending > 0
          ? `${pending} pendência(s)`
          : rows.length > 0
            ? "Pronto"
            : "Sem dados";


      header.append(
        titleGroup,
        status,
      );


      const metrics =
        document.createElement(
          "div",
        );


      metrics.className =
        "billing-model-metrics";


      metrics.append(
        createModelMetric(
          "Execuções",
          String(
            rows.length,
          ),
        ),

        createModelMetric(
          "Participantes",
          String(
            participants,
          ),
        ),

        createModelMetric(
          "Horas",
          formatMinutes(
            totalMinutes,
          ),
        ),

        createModelMetric(
          "Fotos",
          String(
            photos,
          ),
        ),
      );


      if (
        model.tipo_arquivo ===
        "docm"
      ) {
        metrics.append(
          createModelMetric(
            "Kits",
            kitTotal
              .toLocaleString(
                "pt-BR",
                {
                  maximumFractionDigits:
                    2,
                },
              ),
          ),
        );
      }


      if (
        model.codigo ===
        "relatorio_paebm"
      ) {
        const workshopMinutes =
          rows
            .filter(
              (row) =>
                row.tipo_evento ===
                "oficina_educacional",
            )
            .reduce(
              (
                total,
                row,
              ) =>
                total +
                Number(
                  row.minutos_evento ||
                  0,
                ),
              0,
            );


        const communityMinutes =
          rows
            .filter(
              (row) =>
                row.tipo_evento ===
                "evento_comunidade",
            )
            .reduce(
              (
                total,
                row,
              ) =>
                total +
                Number(
                  row.minutos_evento ||
                  0,
                ),
              0,
            );


        metrics.append(
          createModelMetric(
            "Horas oficinas",
            formatMinutes(
              workshopMinutes,
            ),
          ),

          createModelMetric(
            "Horas comunidade",
            formatMinutes(
              communityMinutes,
            ),
          ),
        );
      }


      const footer =
        document.createElement(
          "div",
        );


      footer.className =
        "billing-model-card-footer";


      footer.textContent =
        model.responsavel_contrato &&
        model.responsavel_contrato !==
          "—"
          ? `Responsável: ${model.responsavel_contrato}`
          : "Modelo PAEBM";


      card.append(
        header,
        metrics,
        footer,
      );


      elements.modelGrid.append(
        card,
      );
    },
  );
}


/* =========================================================
   MAPEAMENTO
========================================================= */

function getFilteredActivities(
  elements,
) {
  const regionalId =
    elements.regional.value;


  const mappingStatus =
    elements.mappingStatus.value;


  return activities.filter(
    (activity) => {

      const mapping =
        getMappingForActivity(
          activity,
        );


      return (
        (
          !regionalId

          ||
          activity.regional_id ===
            regionalId
        )

        &&

        (
          mappingStatus ===
            "all"

          ||
          (
            mappingStatus ===
              "mapped"

            &&
            Boolean(
              mapping,
            )
          )

          ||

          (
            mappingStatus ===
              "unmapped"

            &&
            !mapping
          )
        )
      );
    },
  );
}


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


function createMappingDestinationCell(
  activity,
) {
  const cell =
    document.createElement(
      "td",
    );


  const mapping =
    getMappingForActivity(
      activity,
    );


  if (
    !mapping
  ) {
    const badge =
      document.createElement(
        "span",
      );


    badge.className =
      "billing-badge billing-badge-unmapped";


    badge.textContent =
      "Sem mapeamento";


    cell.append(
      badge,
    );


    return cell;
  }


  const model =
    getModelByCode(
      mapping.modelo_codigo,
    );


  const item =
    getItem(
      mapping.modelo_codigo,
      mapping.item_codigo,
    );


  const wrapper =
    document.createElement(
      "div",
    );


  wrapper.className =
    "billing-destination";


  const strong =
    document.createElement(
      "strong",
    );


  strong.textContent =
    model?.nome ||
    mapping.modelo_codigo;


  const span =
    document.createElement(
      "span",
    );


  span.textContent =
    item?.nome ||
    mapping.item_codigo;


  wrapper.append(
    strong,
    span,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


function openMappingDialog(
  activity,
  elements,
) {
  selectedActivity =
    activity;


  const regional =
    getRegionalById(
      activity.regional_id,
    );


  const current =
    getMappingForActivity(
      activity,
    );


  elements.dialogRegional.textContent =
    regional?.nome ||
    "—";


  elements.dialogType.textContent =
    EVENT_TYPE_LABELS[
      activity.tipo_evento
    ] ||
    activity.tipo_evento;


  elements.dialogActivity.textContent =
    activity.atividade;


  elements.dialogDestination
    .replaceChildren();


  const placeholder =
    document.createElement(
      "option",
    );


  placeholder.value =
    "";


  placeholder.textContent =
    "Selecione...";


  elements.dialogDestination
    .append(
      placeholder,
    );


  const allowedModels =
    models.filter(
      (model) =>
        model.regional_id ===
        activity.regional_id,
    );


  allowedModels.forEach(
    (model) => {

      const group =
        document.createElement(
          "optgroup",
        );


      group.label =
        `${model.nome} · Contrato ${model.contrato}`;


      billingItems
        .filter(
          (item) =>
            item.modelo_codigo ===
            model.codigo,
        )
        .sort(
          (
            a,
            b,
          ) =>
            Number(
              a.ordem ||
              0,
            )
            -
            Number(
              b.ordem ||
              0,
            ),
        )
        .forEach(
          (item) => {

            const option =
              document.createElement(
                "option",
              );


            option.value =
              `${model.codigo}|||${item.codigo}`;


            option.textContent =
              item.nome;


            group.append(
              option,
            );
          },
        );


      elements.dialogDestination
        .append(
          group,
        );
    },
  );


  if (
    current
  ) {
    elements.dialogDestination.value =
      `${current.modelo_codigo}|||${current.item_codigo}`;
  }


  setDialogStatus(
    elements,
  );


  elements.dialog.showModal();
}


function closeMappingDialog(
  elements,
) {
  selectedActivity =
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


function createMappingActionCell(
  activity,
  elements,
) {
  const cell =
    document.createElement(
      "td",
    );


  const mapping =
    getMappingForActivity(
      activity,
    );


  const button =
    document.createElement(
      "button",
    );


  button.type =
    "button";


  button.className =
    "btn btn-ghost";


  button.textContent =
    mapping
      ? "Alterar"
      : "Mapear";


  button.addEventListener(
    "click",
    () => {

      openMappingDialog(
        activity,
        elements,
      );
    },
  );


  cell.append(
    button,
  );


  return cell;
}


function renderMappingTable(
  elements,
) {
  const filtered =
    getFilteredActivities(
      elements,
    );


  elements.mappingBody
    .replaceChildren();


  elements.mappingEmpty.hidden =
    filtered.length >
    0;


  filtered.forEach(
    (activity) => {

      const regional =
        getRegionalById(
          activity.regional_id,
        );


      const row =
        document.createElement(
          "tr",
        );


      row.append(
        createTextCell(
          regional?.nome ||
          "—",
        ),

        createTextCell(
          EVENT_TYPE_LABELS[
            activity.tipo_evento
          ] ||
          activity.tipo_evento,
        ),

        createTextCell(
          activity.atividade,
        ),

        createMappingDestinationCell(
          activity,
        ),

        createMappingActionCell(
          activity,
          elements,
        ),
      );


      elements.mappingBody.append(
        row,
      );
    },
  );
}


/* =========================================================
   PREVIEW
========================================================= */

function createPreviewEventCell(
  rowData,
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
    "billing-event-cell";


  const strong =
    document.createElement(
      "strong",
    );


  strong.textContent =
    rowData.atividade;


  const span =
    document.createElement(
      "span",
    );


  span.textContent =
    EVENT_TYPE_LABELS[
      rowData.tipo_evento
    ] ||
    rowData.tipo_evento;


  wrapper.append(
    strong,
    span,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


function createPreviewSchoolCell(
  rowData,
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
    "billing-school-cell";


  const strong =
    document.createElement(
      "strong",
    );


  strong.textContent =
    rowData.escola_nome ||
    "—";


  const span =
    document.createElement(
      "span",
    );


  span.textContent =
    rowData.cidade ||
    "—";


  wrapper.append(
    strong,
    span,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


function createPreviewModelCell(
  rowData,
) {
  const cell =
    document.createElement(
      "td",
    );


  if (
    !rowData.modelo_codigo
  ) {
    const badge =
      document.createElement(
        "span",
      );


    badge.className =
      "billing-badge billing-badge-unmapped";


    badge.textContent =
      "Sem mapeamento";


    cell.append(
      badge,
    );


    return cell;
  }


  const wrapper =
    document.createElement(
      "div",
    );


  wrapper.className =
    "billing-destination";


  const strong =
    document.createElement(
      "strong",
    );


  strong.textContent =
    rowData.modelo_nome ||
    rowData.modelo_codigo;


  const span =
    document.createElement(
      "span",
    );


  span.textContent =
    rowData.item_nome ||
    rowData.item_codigo ||
    "—";


  wrapper.append(
    strong,
    span,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


function createPreviewStatusCell(
  rowData,
) {
  const cell =
    document.createElement(
      "td",
    );


  const pendingItems =
    Array.isArray(
      rowData.pendencias,
    )
      ? rowData.pendencias
      : [];


  if (
    rowData.modelo_codigo

    &&
    rowData.completo ===
      true
  ) {
    const badge =
      document.createElement(
        "span",
      );


    badge.className =
      "billing-badge billing-badge-ready";


    badge.textContent =
      "Pronto";


    cell.append(
      badge,
    );


    return cell;
  }


  const details =
    document.createElement(
      "details",
    );


  details.className =
    "billing-pending-details";


  const summary =
    document.createElement(
      "summary",
    );


  summary.textContent =
    rowData.modelo_codigo
      ? `${pendingItems.length} pendência(s)`
      : "Sem mapeamento";


  const list =
    document.createElement(
      "ul",
    );


  pendingItems.forEach(
    (item) => {

      const listItem =
        document.createElement(
          "li",
        );


      listItem.textContent =
        item;


      list.append(
        listItem,
      );
    },
  );


  if (
    !pendingItems.length
  ) {
    const listItem =
      document.createElement(
        "li",
      );


    listItem.textContent =
      "Configure a regra de faturamento desta atividade.";


    list.append(
      listItem,
    );
  }


  details.append(
    summary,
    list,
  );


  cell.append(
    details,
  );


  return cell;
}


function renderPreviewTable(
  elements,
) {
  elements.previewBody
    .replaceChildren();


  elements.previewEmpty.hidden =
    previewRows.length >
    0;


  previewRows.forEach(
    (rowData) => {

      const row =
        document.createElement(
          "tr",
        );


      row.append(
        createTextCell(
          formatDateBR(
            rowData.data_real,
          ),
        ),

        createPreviewEventCell(
          rowData,
        ),

        createPreviewSchoolCell(
          rowData,
        ),

        createTextCell(
          rowData.regional_nome ||
          "—",
        ),

        createPreviewModelCell(
          rowData,
        ),

        createTextCell(
          String(
            rowData.participantes_reais ??
            "—",
          ),
        ),

        createTextCell(
          formatMinutes(
            rowData.minutos_evento,
          ),
        ),

        createTextCell(
          String(
            rowData.fotos_quantidade ||
            0,
          ),
        ),

        createPreviewStatusCell(
          rowData,
        ),
      );


      elements.previewBody.append(
        row,
      );
    },
  );
}


/* =========================================================
   RENDER GERAL
========================================================= */

function render(
  elements,
) {
  renderPeriod(
    elements,
  );


  renderSummary(
    elements,
  );


  renderModels(
    elements,
  );


  renderMappingTable(
    elements,
  );


  renderPreviewTable(
    elements,
  );
}


/* =========================================================
   SALVAR MAPEAMENTO
========================================================= */

async function saveMapping(
  elements,
) {
  if (
    !selectedActivity
  ) {
    return;
  }


  const value =
    elements.dialogDestination
      .value;


  if (
    !value
  ) {
    setDialogStatus(
      elements,
      "Selecione o destino do faturamento.",
      "error",
    );


    return;
  }


  const [
    modelCode,
    itemCode,
  ] =
    value.split(
      "|||",
    );


  elements.dialogSave.disabled =
    true;


  try {

    setDialogStatus(
      elements,
      "Salvando mapeamento...",
      "loading",
    );


    const {
      error,
    } =
      await supabase.rpc(
        "save_billing_activity_mapping",
        {
          p_regional_id:
            selectedActivity.regional_id,

          p_tipo_evento:
            selectedActivity.tipo_evento,

          p_atividade:
            selectedActivity.atividade,

          p_modelo_codigo:
            modelCode,

          p_item_codigo:
            itemCode,
        },
      );


    if (
      error
    ) {
      throw error;
    }


    await Promise.all([
      loadMappings(),
      loadPreview(
        elements,
      ),
    ]);


    closeMappingDialog(
      elements,
    );


    render(
      elements,
    );


    setMessage(
      elements,
      "Mapeamento salvo com sucesso.",
      "success",
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Erro ao salvar mapeamento:",
      error,
    );


    setDialogStatus(
      elements,
      error?.message ||
      "Não foi possível salvar o mapeamento.",
      "error",
    );

  } finally {

    elements.dialogSave.disabled =
      false;
  }
}


/* =========================================================
   ATUALIZAR
========================================================= */

async function refreshBilling(
  elements,
) {
  try {

    setMessage(
      elements,
      "Atualizando faturamento...",
      "loading",
    );


    await Promise.all([
      loadMappings(),
      loadActivities(),
    ]);


    await loadPreview(
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
      "[YXZ] Erro ao carregar faturamento:",
      error,
    );


    previewRows =
      [];


    render(
      elements,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar o faturamento.",
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

      await refreshBilling(
        elements,
      );
    },
  );


  elements.regional.addEventListener(
    "change",
    async () => {

      await refreshBilling(
        elements,
      );
    },
  );


  elements.mappingStatus.addEventListener(
    "change",
    () => {

      renderMappingTable(
        elements,
      );
    },
  );


  elements.refresh.addEventListener(
    "click",
    async () => {

      await refreshBilling(
        elements,
      );
    },
  );


  elements.generate.addEventListener(
    "click",
    () => {

      setMessage(
        elements,
        "A geração dos DOCM e PPTX oficiais será conectada na próxima etapa.",
        "info",
      );
    },
  );


  elements.dialogForm.addEventListener(
    "submit",
    async (
      event,
    ) => {

      event.preventDefault();


      await saveMapping(
        elements,
      );
    },
  );


  elements.dialogCloseButtons
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            closeMappingDialog(
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


      closeMappingDialog(
        elements,
      );
    },
  );


  elements.dialog.addEventListener(
    "click",
    (
      event,
    ) => {

      if (
        event.target ===
        elements.dialog
      ) {
        closeMappingDialog(
          elements,
        );
      }
    },
  );
}


/* =========================================================
   INIT
========================================================= */

export async function initFaturamentoPage() {
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
      "Carregando faturamento mensal...",
      "loading",
    );


    await Promise.all([
      loadRegionals(),
      loadModels(),
      loadBillingItems(),
      loadMappings(),
    ]);


    populateRegionalFilter(
      elements,
    );


    await loadActivities();


    await loadPreview(
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
      "[YXZ] Não foi possível iniciar Faturamento:",
      error,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível carregar o módulo de Faturamento Mensal.",
      "error",
    );
  }
}
