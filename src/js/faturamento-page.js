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
let billingGenerations = [];
let billingGenerationFiles = [];

let generationPollTimer =
  null;

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

    generateSecondary:
      document.querySelector(
        "[data-billing-generate-secondary]",
      ),

    historyRefresh:
      document.querySelector(
        "[data-billing-history-refresh]",
      ),

    generationHistory:
      document.querySelector(
        "[data-billing-generation-history]",
      ),

    generationEmpty:
      document.querySelector(
        "[data-billing-generation-empty]",
      ),

    bhNumber:
      document.querySelector(
        "[data-billing-bh-number]",
      ),

    bhEducator1:
      document.querySelector(
        "[data-billing-bh-educator-1]",
      ),

    valNumber:
      document.querySelector(
        "[data-billing-val-number]",
      ),

    valEducator1:
      document.querySelector(
        "[data-billing-val-educator-1]",
      ),

    valEducator2:
      document.querySelector(
        "[data-billing-val-educator-2]",
      ),

    vixNumber:
      document.querySelector(
        "[data-billing-vix-number]",
      ),

    vixEducator1:
      document.querySelector(
        "[data-billing-vix-educator-1]",
      ),

    vixEducator2:
      document.querySelector(
        "[data-billing-vix-educator-2]",
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



function formatDateTimeBR(
  value,
) {
  if (!value) {
    return "—";
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }


  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    },
  ).format(
    date,
  );
}


function formatCompetenceBR(
  value,
) {
  if (!value) {
    return "—";
  }


  const [
    year,
    month,
  ] =
    String(
      value,
    ).split(
      "-",
    );


  return `${month}/${year}`;
}


function formatBytes(
  value,
) {
  const bytes =
    Number(
      value ||
      0,
    );


  if (!bytes) {
    return "";
  }


  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }


  const kb =
    bytes /
    1024;


  if (
    kb <
    1024
  ) {
    return `${kb.toFixed(1)} KB`;
  }


  return `${(
    kb /
    1024
  ).toFixed(1)} MB`;
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



async function loadGenerations() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "faturamento_geracoes",
      )
      .select(`
        id,
        competencia,
        data_inicial,
        data_final,
        status,
        parametros,
        created_at,
        iniciado_at,
        finalizado_at,
        erro
      `)
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(
        12,
      );


  if (error) {
    throw error;
  }


  billingGenerations =
    data ||
    [];


  const generationIds =
    billingGenerations.map(
      (generation) =>
        generation.id,
    );


  if (
    !generationIds.length
  ) {
    billingGenerationFiles =
      [];

    return;
  }


  const {
    data: filesData,
    error: filesError,
  } =
    await supabase
      .from(
        "faturamento_geracao_arquivos",
      )
      .select(`
        id,
        geracao_id,
        modelo_codigo,
        status,
        numero_relatorio,
        educador_1,
        educador_2,
        storage_path,
        nome_arquivo,
        tamanho_bytes,
        mime_type,
        erro,
        avisos,
        created_at,
        updated_at
      `)
      .in(
        "geracao_id",
        generationIds,
      )
      .order(
        "created_at",
      );


  if (filesError) {
    throw filesError;
  }


  billingGenerationFiles =
    filesData ||
    [];
}


async function loadFullPreviewForGeneration(
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
          null,
      },
    );


  if (error) {
    throw error;
  }


  return data ||
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
   GERAÇÕES
========================================================= */

function getGenerationStatusLabel(
  status,
) {
  const labels = {
    pendente:
      "Pendente",

    processando:
      "Processando",

    concluida:
      "Concluída",

    erro:
      "Erro",

    cancelada:
      "Cancelada",
  };


  return labels[
    status
  ] ||
  status ||
  "—";
}


function getFileStatusLabel(
  status,
) {
  const labels = {
    pendente:
      "Pendente",

    processando:
      "Processando",

    concluido:
      "Concluído",

    ignorado:
      "Ignorado",

    erro:
      "Erro",
  };


  return labels[
    status
  ] ||
  status ||
  "—";
}


function createGenerationBadge(
  status,
) {
  const badge =
    document.createElement(
      "span",
    );


  badge.className =
    `billing-generation-status billing-generation-status-${status || "neutral"}`;


  badge.textContent =
    getGenerationStatusLabel(
      status,
    );


  return badge;
}


function createFileBadge(
  status,
) {
  const badge =
    document.createElement(
      "span",
    );


  badge.className =
    `billing-file-status billing-file-status-${status || "neutral"}`;


  badge.textContent =
    getFileStatusLabel(
      status,
    );


  return badge;
}


async function downloadGeneratedFile(
  file,
  elements,
) {
  if (
    !file?.storage_path
  ) {
    setMessage(
      elements,
      "Este arquivo ainda não está disponível para download.",
      "error",
    );

    return;
  }


  try {

    setMessage(
      elements,
      `Preparando ${file.nome_arquivo || "arquivo"}...`,
      "loading",
    );


    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          "relatorios-gerados",
        )
        .download(
          file.storage_path,
        );


    if (error) {
      throw error;
    }


    const url =
      URL.createObjectURL(
        data,
      );


    const anchor =
      document.createElement(
        "a",
      );


    anchor.href =
      url;


    anchor.download =
      file.nome_arquivo ||
      "relatorio.docm";


    document.body.append(
      anchor,
    );


    anchor.click();


    anchor.remove();


    setTimeout(
      () => {
        URL.revokeObjectURL(
          url,
        );
      },
      1000,
    );


    setMessage(
      elements,
      "Download iniciado.",
      "success",
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Erro ao baixar relatório:",
      error,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível baixar o relatório.",
      "error",
    );
  }
}


async function retryGeneration(
  generationId,
  elements,
) {
  const confirmed =
    window.confirm(
      "Deseja reenviar esta geração para a fila? Arquivos já concluídos não serão refeitos.",
    );


  if (!confirmed) {
    return;
  }


  try {

    setMessage(
      elements,
      "Reenviando geração...",
      "loading",
    );


    const {
      error,
    } =
      await supabase.rpc(
        "retry_billing_generation",
        {
          p_geracao_id:
            generationId,
        },
      );


    if (error) {
      throw error;
    }


    await loadGenerations();


    renderGenerationHistory(
      elements,
    );


    scheduleGenerationPolling(
      elements,
    );


    setMessage(
      elements,
      "Geração reenviada para a fila.",
      "success",
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Erro ao reenviar geração:",
      error,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível reenviar a geração.",
      "error",
    );
  }
}


function renderGenerationFile(
  file,
  elements,
) {
  const model =
    getModelByCode(
      file.modelo_codigo,
    );


  const row =
    document.createElement(
      "div",
    );


  row.className =
    "billing-generation-file";


  const main =
    document.createElement(
      "div",
    );


  main.className =
    "billing-generation-file-main";


  const name =
    document.createElement(
      "strong",
    );


  name.textContent =
    model?.nome ||
    file.modelo_codigo;


  const details =
    document.createElement(
      "span",
    );


  const detailParts =
    [];


  if (
    file.nome_arquivo
  ) {
    detailParts.push(
      file.nome_arquivo,
    );
  }


  const size =
    formatBytes(
      file.tamanho_bytes,
    );


  if (size) {
    detailParts.push(
      size,
    );
  }


  details.textContent =
    detailParts.join(
      " · ",
    ) ||
    String(
      model?.tipo_arquivo ||
      "",
    ).toUpperCase();


  main.append(
    name,
    details,
  );


  const actions =
    document.createElement(
      "div",
    );


  actions.className =
    "billing-generation-file-actions";


  actions.append(
    createFileBadge(
      file.status,
    ),
  );


  if (
    file.status ===
      "concluido"

    &&
    file.storage_path
  ) {
    const download =
      document.createElement(
        "button",
      );


    download.type =
      "button";


    download.className =
      "btn btn-ghost billing-download-button";


    download.textContent =
      "Baixar";


    download.addEventListener(
      "click",
      async () => {

        await downloadGeneratedFile(
          file,
          elements,
        );
      },
    );


    actions.append(
      download,
    );
  }


  row.append(
    main,
    actions,
  );


  if (
    file.erro
    ||
    file.avisos
  ) {
    const info =
      document.createElement(
        "div",
      );


    info.className =
      file.erro
        ? "billing-generation-file-message billing-generation-file-message-error"
        : "billing-generation-file-message";


    info.textContent =
      file.erro ||
      file.avisos;


    row.append(
      info,
    );
  }


  return row;
}


function renderGenerationHistory(
  elements,
) {
  elements.generationHistory
    .replaceChildren();


  elements.generationEmpty.hidden =
    billingGenerations.length >
    0;


  billingGenerations.forEach(
    (generation) => {

      const card =
        document.createElement(
          "article",
        );


      card.className =
        "billing-generation-history-card";


      const header =
        document.createElement(
          "div",
        );


      header.className =
        "billing-generation-history-header";


      const titleGroup =
        document.createElement(
          "div",
        );


      const title =
        document.createElement(
          "strong",
        );


      title.textContent =
        `Competência ${formatCompetenceBR(generation.competencia)}`;


      const meta =
        document.createElement(
          "span",
        );


      meta.textContent =
        `${formatDateBR(generation.data_inicial)} a ${formatDateBR(generation.data_final)} · solicitada em ${formatDateTimeBR(generation.created_at)}`;


      titleGroup.append(
        title,
        meta,
      );


      const headerActions =
        document.createElement(
          "div",
        );


      headerActions.className =
        "billing-generation-history-actions";


      headerActions.append(
        createGenerationBadge(
          generation.status,
        ),
      );


      if (
        generation.status ===
        "erro"
      ) {
        const retry =
          document.createElement(
            "button",
          );


        retry.type =
          "button";


        retry.className =
          "btn btn-ghost";


        retry.textContent =
          "Tentar novamente";


        retry.addEventListener(
          "click",
          async () => {

            await retryGeneration(
              generation.id,
              elements,
            );
          },
        );


        headerActions.append(
          retry,
        );
      }


      header.append(
        titleGroup,
        headerActions,
      );


      const fileList =
        document.createElement(
          "div",
        );


      fileList.className =
        "billing-generation-files";


      const files =
        billingGenerationFiles.filter(
          (file) =>
            file.geracao_id ===
            generation.id,
        );


      files.forEach(
        (file) => {

          fileList.append(
            renderGenerationFile(
              file,
              elements,
            ),
          );
        },
      );


      card.append(
        header,
        fileList,
      );


      if (
        generation.erro
      ) {
        const error =
          document.createElement(
            "p",
          );


        error.className =
          "billing-generation-error";


        error.textContent =
          generation.erro;


        card.append(
          error,
        );
      }


      elements.generationHistory.append(
        card,
      );
    },
  );
}


function scheduleGenerationPolling(
  elements,
) {
  const hasActive =
    billingGenerations.some(
      (generation) =>
        generation.status ===
          "pendente"

        ||
        generation.status ===
          "processando",
    );


  if (
    !hasActive
  ) {
    if (
      generationPollTimer
    ) {
      clearInterval(
        generationPollTimer,
      );


      generationPollTimer =
        null;
    }


    return;
  }


  if (
    generationPollTimer
  ) {
    return;
  }


  generationPollTimer =
    window.setInterval(
      async () => {

        try {

          await loadGenerations();


          renderGenerationHistory(
            elements,
          );


          const stillActive =
            billingGenerations.some(
              (generation) =>
                generation.status ===
                  "pendente"

                ||
                generation.status ===
                  "processando",
            );


          if (
            !stillActive

            &&
            generationPollTimer
          ) {
            clearInterval(
              generationPollTimer,
            );


            generationPollTimer =
              null;
          }

        } catch (
          error
        ) {

          console.error(
            "[YXZ] Erro ao atualizar fila de faturamento:",
            error,
          );
        }
      },
      5000,
    );
}


/* =========================================================
   CRIAR GERAÇÃO
========================================================= */

function requireGenerationValue(
  input,
  label,
) {
  const value =
    String(
      input?.value ||
      "",
    ).trim();


  if (!value) {
    throw new Error(
      `Informe ${label}.`,
    );
  }


  return value;
}


function getGenerationParameters(
  elements,
) {
  return {
    relatorio_bh: {
      numero_relatorio:
        requireGenerationValue(
          elements.bhNumber,
          "o número do Relatório BH",
        ),

      educador_1:
        requireGenerationValue(
          elements.bhEducator1,
          "Educador Socioambiental 1 do Relatório BH",
        ),
    },

    relatorio_val: {
      numero_relatorio:
        requireGenerationValue(
          elements.valNumber,
          "o número do Relatório VAL",
        ),

      educador_1:
        requireGenerationValue(
          elements.valEducator1,
          "Educador Socioambiental 1 do Relatório VAL",
        ),

      educador_2:
        requireGenerationValue(
          elements.valEducator2,
          "Educador Socioambiental 2 do Relatório VAL",
        ),
    },

    relatorio_vix: {
      numero_relatorio:
        requireGenerationValue(
          elements.vixNumber,
          "o número do Relatório VIX",
        ),

      educador_1:
        requireGenerationValue(
          elements.vixEducator1,
          "Educador Socioambiental 1 do Relatório VIX",
        ),

      educador_2:
        requireGenerationValue(
          elements.vixEducator2,
          "Educador Socioambiental 2 do Relatório VIX",
        ),
    },

    relatorio_paebm: {},
  };
}


function setGenerateButtonsDisabled(
  elements,
  disabled,
) {
  elements.generate.disabled =
    disabled;


  if (
    elements.generateSecondary
  ) {
    elements.generateSecondary.disabled =
      disabled;
  }
}


async function createBillingGeneration(
  elements,
) {
  setGenerateButtonsDisabled(
    elements,
    true,
  );


  try {

    setMessage(
      elements,
      "Validando dados para geração...",
      "loading",
    );


    const period =
      getBillingPeriod(
        elements.month.value,
      );


    await loadGenerations();


    const activeGeneration =
      billingGenerations.find(
        (generation) =>
          generation.competencia ===
            period.competence

          &&
          (
            generation.status ===
              "pendente"

            ||
            generation.status ===
              "processando"
          ),
      );


    if (
      activeGeneration
    ) {
      throw new Error(
        "Já existe uma geração pendente ou em processamento para esta competência.",
      );
    }


    const parameters =
      getGenerationParameters(
        elements,
      );


    const fullPreview =
      await loadFullPreviewForGeneration(
        elements,
      );


    const mappedRows =
      fullPreview.filter(
        (row) =>
          Boolean(
            row.modelo_codigo,
          ),
      );


    if (
      !mappedRows.length
    ) {
      throw new Error(
        "Não existem execuções mapeadas para os relatórios oficiais nesta competência.",
      );
    }


    const incompleteMappedRows =
      mappedRows.filter(
        (row) =>
          row.completo !==
            true,
      );


    if (
      incompleteMappedRows.length
    ) {
      throw new Error(
        `Existem ${incompleteMappedRows.length} execução(ões) mapeada(s) para os relatórios oficiais com pendências. Corrija-as antes de gerar.`,
      );
    }


    const unmappedCount =
      fullPreview.filter(
        (row) =>
          !row.modelo_codigo,
      ).length;


    if (
      unmappedCount >
      0
    ) {
      const confirmed =
        window.confirm(
          `Existem ${unmappedCount} execução(ões) sem mapeamento nesta competência. Elas serão ignoradas. Deseja continuar?`,
        );


      if (!confirmed) {
        setMessage(
          elements,
          "Geração cancelada.",
          "info",
        );

        return;
      }
    }


    const {
      data,
      error,
    } =
      await supabase.rpc(
        "create_billing_generation",
        {
          p_competencia:
            period.competence,

          p_parametros:
            parameters,
        },
      );


    if (error) {
      throw error;
    }


    await loadGenerations();


    renderGenerationHistory(
      elements,
    );


    scheduleGenerationPolling(
      elements,
    );


    setMessage(
      elements,
      `Geração ${String(data).slice(0, 8)} criada. O Gerador Windows processará BH, VAL, VIX e PAEBM automaticamente.`,
      "success",
    );

  } catch (
    error
  ) {

    console.error(
      "[YXZ] Erro ao criar geração:",
      error,
    );


    setMessage(
      elements,
      error?.message ||
      "Não foi possível criar a geração.",
      "error",
    );

  } finally {

    setGenerateButtonsDisabled(
      elements,
      false,
    );
  }
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


  renderGenerationHistory(
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
      loadGenerations(),
    ]);


    await loadPreview(
      elements,
    );


    render(
      elements,
    );


    scheduleGenerationPolling(
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
    async () => {

      await createBillingGeneration(
        elements,
      );
    },
  );


  if (
    elements.generateSecondary
  ) {
    elements.generateSecondary.addEventListener(
      "click",
      async () => {

        await createBillingGeneration(
          elements,
        );
      },
    );
  }


  if (
    elements.historyRefresh
  ) {
    elements.historyRefresh.addEventListener(
      "click",
      async () => {

        try {

          setMessage(
            elements,
            "Atualizando histórico...",
            "loading",
          );


          await loadGenerations();


          renderGenerationHistory(
            elements,
          );


          scheduleGenerationPolling(
            elements,
          );


          setMessage(
            elements,
            "",
          );

        } catch (
          error
        ) {

          setMessage(
            elements,
            error?.message ||
            "Não foi possível atualizar o histórico.",
            "error",
          );
        }
      },
    );
  }


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
      loadGenerations(),
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


    scheduleGenerationPolling(
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
