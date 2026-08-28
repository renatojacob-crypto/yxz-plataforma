import {
  supabase,
} from "./supabase.js";


let instructors = [];
let regionals = [];
let instructorRegionals = [];

let selectedInstructorId =
  null;


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-instructors-message]",
      ),

    total:
      document.querySelector(
        "[data-instructors-total]",
      ),

    active:
      document.querySelector(
        "[data-instructors-active]",
      ),

    inactive:
      document.querySelector(
        "[data-instructors-inactive]",
      ),

    withoutRegion:
      document.querySelector(
        "[data-instructors-without-region]",
      ),

    search:
      document.querySelector(
        "[data-instructors-search]",
      ),

    statusFilter:
      document.querySelector(
        "[data-instructors-status-filter]",
      ),

    regionalFilter:
      document.querySelector(
        "[data-instructors-regional-filter]",
      ),

    tableBody:
      document.querySelector(
        "[data-instructors-table-body]",
      ),

    empty:
      document.querySelector(
        "[data-instructors-empty]",
      ),

    newButton:
      document.querySelector(
        "[data-new-instructor]",
      ),


    /* MODAL */

    dialog:
      document.getElementById(
        "instructorDialog",
      ),

    form:
      document.getElementById(
        "instructorForm",
      ),

    dialogKicker:
      document.querySelector(
        "[data-instructor-dialog-kicker]",
      ),

    dialogTitle:
      document.querySelector(
        "[data-instructor-dialog-title]",
      ),

    name:
      document.querySelector(
        "[data-instructor-name]",
      ),

    email:
      document.querySelector(
        "[data-instructor-email]",
      ),

    phone:
      document.querySelector(
        "[data-instructor-phone]",
      ),

    notes:
      document.querySelector(
        "[data-instructor-notes]",
      ),

    activeInput:
      document.querySelector(
        "[data-instructor-active]",
      ),

    regionalsContainer:
      document.querySelector(
        "[data-instructor-regionals]",
      ),

    status:
      document.querySelector(
        "[data-instructor-status]",
      ),

    save:
      document.querySelector(
        "[data-instructor-save]",
      ),

    closeButtons:
      document.querySelectorAll(
        "[data-instructor-dialog-close]",
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
    value || "",
  )
    .normalize("NFD")
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


function normalizeOptionalText(
  value,
) {
  const normalized =
    String(
      value || "",
    )
      .trim();


  return normalized ||
    null;
}


function getInstructorById(
  instructorId,
) {
  return (
    instructors.find(
      (instructor) =>
        instructor.id ===
        instructorId,
    ) ||
    null
  );
}


function getRegionalById(
  regionalId,
) {
  return (
    regionals.find(
      (regional) =>
        regional.id ===
        regionalId,
    ) ||
    null
  );
}


function getRegionalIdsForInstructor(
  instructorId,
) {
  return instructorRegionals
    .filter(
      (relation) =>
        relation.instrutor_id ===
        instructorId,
    )
    .map(
      (relation) =>
        relation.regional_id,
    );
}


function getRegionalsForInstructor(
  instructorId,
) {
  return getRegionalIdsForInstructor(
    instructorId,
  )
    .map(
      (regionalId) =>
        getRegionalById(
          regionalId,
        ),
    )
    .filter(
      Boolean,
    )
    .sort(
      (a, b) =>
        (a.ordem || 0) -
        (b.ordem || 0),
    );
}


function setPageMessage(
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


function setDialogStatus(
  elements,
  message = "",
  state = "",
) {
  if (!elements.status) {
    return;
  }


  elements.status.textContent =
    message;


  elements.status.dataset.state =
    state;
}


/* =========================================================
   CARREGAMENTO
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
        profile_id,
        nome,
        email,
        telefone,
        ativo,
        observacoes,
        created_at,
        updated_at
      `)
      .order(
        "nome",
        {
          ascending:
            true,
        },
      );


  if (error) {
    throw error;
  }


  instructors =
    Array.isArray(data)
      ? data
      : [];
}


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


  if (error) {
    throw error;
  }


  regionals =
    Array.isArray(data)
      ? data
      : [];
}


async function loadInstructorRegionals() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "instrutor_regionais",
      )
      .select(`
        instrutor_id,
        regional_id,
        created_at
      `);


  if (error) {
    throw error;
  }


  instructorRegionals =
    Array.isArray(data)
      ? data
      : [];
}


async function reloadData() {
  await Promise.all([
    loadInstructors(),
    loadInstructorRegionals(),
  ]);
}


/* =========================================================
   RESUMO
========================================================= */

function renderSummary(
  elements,
) {
  const total =
    instructors.length;


  const active =
    instructors.filter(
      (instructor) =>
        instructor.ativo,
    ).length;


  const inactive =
    total -
    active;


  const withoutRegion =
    instructors.filter(
      (instructor) =>
        getRegionalIdsForInstructor(
          instructor.id,
        ).length === 0,
    ).length;


  elements.total.textContent =
    String(
      total,
    );


  elements.active.textContent =
    String(
      active,
    );


  elements.inactive.textContent =
    String(
      inactive,
    );


  elements.withoutRegion.textContent =
    String(
      withoutRegion,
    );
}


/* =========================================================
   FILTRO DE REGIONAIS
========================================================= */

function populateRegionalFilter(
  elements,
) {
  if (!elements.regionalFilter) {
    return;
  }


  const previousValue =
    elements.regionalFilter.value;


  elements.regionalFilter
    .replaceChildren();


  const allOption =
    document.createElement(
      "option",
    );


  allOption.value =
    "all";


  allOption.textContent =
    "Todas";


  elements.regionalFilter.append(
    allOption,
  );


  const noneOption =
    document.createElement(
      "option",
    );


  noneOption.value =
    "none";


  noneOption.textContent =
    "Sem Regional";


  elements.regionalFilter.append(
    noneOption,
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


      elements.regionalFilter.append(
        option,
      );
    },
  );


  if (
    Array.from(
      elements.regionalFilter.options,
    ).some(
      (option) =>
        option.value ===
        previousValue,
    )
  ) {
    elements.regionalFilter.value =
      previousValue;
  }
}


/* =========================================================
   CHECKBOXES DAS REGIONAIS
========================================================= */

function renderRegionalCheckboxes(
  elements,
  selectedIds = [],
) {
  const container =
    elements.regionalsContainer;


  if (!container) {
    return;
  }


  container.replaceChildren();


  const activeRegionals =
    regionals.filter(
      (regional) =>
        regional.ativo,
    );


  if (!activeRegionals.length) {
    const message =
      document.createElement(
        "span",
      );


    message.className =
      "instructors-regionals-loading";


    message.textContent =
      "Nenhuma Regional ativa disponível.";


    container.append(
      message,
    );


    return;
  }


  activeRegionals.forEach(
    (regional) => {
      const label =
        document.createElement(
          "label",
        );


      label.className =
        "instructors-regional-option";


      const input =
        document.createElement(
          "input",
        );


      input.type =
        "checkbox";


      input.value =
        regional.id;


      input.checked =
        selectedIds.includes(
          regional.id,
        );


      input.dataset.instructorRegional =
        regional.id;


      const content =
        document.createElement(
          "span",
        );


      const title =
        document.createElement(
          "strong",
        );


      title.textContent =
        regional.nome;


      const description =
        document.createElement(
          "small",
        );


      description.textContent =
        "Instrutor disponível para escalas nesta Regional.";


      content.append(
        title,
        description,
      );


      label.append(
        input,
        content,
      );


      container.append(
        label,
      );
    },
  );
}


function getSelectedRegionalIds(
  elements,
) {
  if (!elements.regionalsContainer) {
    return [];
  }


  return Array.from(
    elements.regionalsContainer
      .querySelectorAll(
        "input[data-instructor-regional]:checked",
      ),
  )
    .map(
      (input) =>
        input.value,
    )
    .filter(
      Boolean,
    );
}


/* =========================================================
   FILTROS
========================================================= */

function getFilteredInstructors(
  elements,
) {
  const search =
    normalizeText(
      elements.search
        ?.value,
    );


  const status =
    elements.statusFilter
      ?.value ||
    "all";


  const regional =
    elements.regionalFilter
      ?.value ||
    "all";


  return instructors.filter(
    (instructor) => {
      const searchable =
        normalizeText(
          [
            instructor.nome,
            instructor.email,
            instructor.telefone,
          ].join(
            " ",
          ),
        );


      const matchesSearch =
        !search ||
        searchable.includes(
          search,
        );


      const matchesStatus =
        status ===
          "all" ||
        (
          status ===
            "active" &&
          instructor.ativo
        ) ||
        (
          status ===
            "inactive" &&
          !instructor.ativo
        );


      const instructorRegionalIds =
        getRegionalIdsForInstructor(
          instructor.id,
        );


      let matchesRegional =
        true;


      if (
        regional ===
        "none"
      ) {
        matchesRegional =
          instructorRegionalIds
            .length === 0;

      } else if (
        regional !==
        "all"
      ) {

        matchesRegional =
          instructorRegionalIds
            .includes(
              regional,
            );
      }


      return (
        matchesSearch &&
        matchesStatus &&
        matchesRegional
      );
    },
  );
}


/* =========================================================
   AVATAR
========================================================= */

function getInitials(
  name,
) {
  const parts =
    String(
      name || "",
    )
      .trim()
      .split(
        /\s+/,
      )
      .filter(
        Boolean,
      );


  if (!parts.length) {
    return "—";
  }


  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(
        0,
        2,
      )
      .toUpperCase();
  }


  return (
    parts[0][0] +
    parts[
      parts.length -
      1
    ][0]
  )
    .toUpperCase();
}


/* =========================================================
   CÉLULA INSTRUTOR
========================================================= */

function createInstructorCell(
  instructor,
) {
  const cell =
    document.createElement(
      "td",
    );


  const person =
    document.createElement(
      "div",
    );


  person.className =
    "instructors-person";


  const avatar =
    document.createElement(
      "div",
    );


  avatar.className =
    "instructors-person-avatar";


  avatar.textContent =
    getInitials(
      instructor.nome,
    );


  const info =
    document.createElement(
      "div",
    );


  const name =
    document.createElement(
      "strong",
    );


  name.textContent =
    instructor.nome;


  const access =
    document.createElement(
      "span",
    );


  access.textContent =
    instructor.profile_id
      ? "Conta vinculada"
      : "Sem acesso ao portal";


  info.append(
    name,
    access,
  );


  person.append(
    avatar,
    info,
  );


  cell.append(
    person,
  );


  return cell;
}


/* =========================================================
   CONTATO
========================================================= */

function createContactCell(
  instructor,
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
    "instructors-contact";


  if (
    instructor.email
  ) {
    const email =
      document.createElement(
        "span",
      );


    email.textContent =
      instructor.email;


    wrapper.append(
      email,
    );
  }


  if (
    instructor.telefone
  ) {
    const phone =
      document.createElement(
        "small",
      );


    phone.textContent =
      instructor.telefone;


    wrapper.append(
      phone,
    );
  }


  if (
    !instructor.email &&
    !instructor.telefone
  ) {
    const empty =
      document.createElement(
        "span",
      );


    empty.textContent =
      "—";


    wrapper.append(
      empty,
    );
  }


  cell.append(
    wrapper,
  );


  return cell;
}


/* =========================================================
   REGIONAIS
========================================================= */

function createRegionalsCell(
  instructor,
) {
  const cell =
    document.createElement(
      "td",
    );


  const assignedRegionals =
    getRegionalsForInstructor(
      instructor.id,
    );


  const wrapper =
    document.createElement(
      "div",
    );


  wrapper.className =
    "instructors-regional-badges";


  if (
    !assignedRegionals.length
  ) {
    const empty =
      document.createElement(
        "span",
      );


    empty.className =
      "instructors-regional-empty";


    empty.textContent =
      "Sem Regional";


    wrapper.append(
      empty,
    );


    cell.append(
      wrapper,
    );


    return cell;
  }


  assignedRegionals.forEach(
    (regional) => {
      const badge =
        document.createElement(
          "span",
        );


      badge.className =
        "instructors-regional-badge";


      if (
        regional.codigo
      ) {
        badge.classList.add(
          `instructors-regional-${regional.codigo}`,
        );
      }


      badge.textContent =
        regional.nome;


      wrapper.append(
        badge,
      );
    },
  );


  cell.append(
    wrapper,
  );


  return cell;
}


/* =========================================================
   STATUS
========================================================= */

function createStatusCell(
  instructor,
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
    instructor.ativo
      ? "instructors-status instructors-status-active"
      : "instructors-status instructors-status-inactive";


  badge.textContent =
    instructor.ativo
      ? "Ativo"
      : "Inativo";


  cell.append(
    badge,
  );


  return cell;
}


/* =========================================================
   AÇÕES
========================================================= */

function createButton(
  label,
  callback,
) {
  const button =
    document.createElement(
      "button",
    );


  button.type =
    "button";


  button.className =
    "btn btn-ghost";


  button.textContent =
    label;


  button.addEventListener(
    "click",
    callback,
  );


  return button;
}


function createActionsCell(
  instructor,
  elements,
) {
  const cell =
    document.createElement(
      "td",
    );


  const actions =
    document.createElement(
      "div",
    );


  actions.className =
    "instructors-actions";


  actions.append(
    createButton(
      "Editar",
      () => {
        openEditDialog(
          instructor.id,
          elements,
        );
      },
    ),
  );


  actions.append(
    createButton(
      instructor.ativo
        ? "Inativar"
        : "Ativar",

      async () => {
        await toggleInstructorStatus(
          instructor.id,
          elements,
        );
      },
    ),
  );


  cell.append(
    actions,
  );


  return cell;
}


/* =========================================================
   TABELA
========================================================= */

function renderTable(
  elements,
) {
  if (!elements.tableBody) {
    return;
  }


  const filtered =
    getFilteredInstructors(
      elements,
    );


  elements.tableBody
    .replaceChildren();


  if (elements.empty) {
    elements.empty.hidden =
      filtered.length >
      0;
  }


  filtered.forEach(
    (instructor) => {
      const row =
        document.createElement(
          "tr",
        );


      row.append(
        createInstructorCell(
          instructor,
        ),

        createContactCell(
          instructor,
        ),

        createRegionalsCell(
          instructor,
        ),

        createStatusCell(
          instructor,
        ),

        createActionsCell(
          instructor,
          elements,
        ),
      );


      elements.tableBody.append(
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


  populateRegionalFilter(
    elements,
  );


  renderTable(
    elements,
  );
}


/* =========================================================
   MODAL
========================================================= */

function resetForm(
  elements,
) {
  elements.form
    ?.reset();


  selectedInstructorId =
    null;


  if (
    elements.activeInput
  ) {
    elements.activeInput.checked =
      true;
  }


  renderRegionalCheckboxes(
    elements,
    [],
  );


  setDialogStatus(
    elements,
  );
}


function openCreateDialog(
  elements,
) {
  resetForm(
    elements,
  );


  elements.dialogKicker.textContent =
    "Novo cadastro";


  elements.dialogTitle.textContent =
    "Novo instrutor";


  elements.save.textContent =
    "Salvar instrutor";


  elements.dialog.showModal();


  requestAnimationFrame(
    () => {
      elements.name.focus();
    },
  );
}


function openEditDialog(
  instructorId,
  elements,
) {
  const instructor =
    getInstructorById(
      instructorId,
    );


  if (!instructor) {
    return;
  }


  selectedInstructorId =
    instructor.id;


  elements.form.reset();


  elements.dialogKicker.textContent =
    "Cadastro existente";


  elements.dialogTitle.textContent =
    "Editar instrutor";


  elements.name.value =
    instructor.nome ||
    "";


  elements.email.value =
    instructor.email ||
    "";


  elements.phone.value =
    instructor.telefone ||
    "";


  elements.notes.value =
    instructor.observacoes ||
    "";


  elements.activeInput.checked =
    Boolean(
      instructor.ativo,
    );


  renderRegionalCheckboxes(
    elements,
    getRegionalIdsForInstructor(
      instructor.id,
    ),
  );


  elements.save.textContent =
    "Salvar alterações";


  setDialogStatus(
    elements,
  );


  elements.dialog.showModal();
}


function closeDialog(
  elements,
) {
  selectedInstructorId =
    null;


  if (
    elements.dialog?.open
  ) {
    elements.dialog.close();
  }


  setDialogStatus(
    elements,
  );
}


/* =========================================================
   SINCRONIZAR REGIONAIS
========================================================= */

async function syncInstructorRegionals(
  instructorId,
  regionalIds,
) {
  const {
    error,
  } =
    await supabase
      .rpc(
        "sync_instructor_regionals",
        {
          p_instrutor_id:
            instructorId,

          p_regional_ids:
            regionalIds,
        },
      );


  if (error) {
    throw error;
  }
}


/* =========================================================
   SALVAR INSTRUTOR
========================================================= */

async function saveInstructor(
  elements,
) {
  const isEditing =
    Boolean(
      selectedInstructorId,
    );


  const instructorId =
    selectedInstructorId;


  const nome =
    elements.name.value
      .trim();


  const email =
    normalizeOptionalText(
      elements.email.value,
    );


  const telefone =
    normalizeOptionalText(
      elements.phone.value,
    );


  const observacoes =
    normalizeOptionalText(
      elements.notes.value,
    );


  const ativo =
    Boolean(
      elements.activeInput.checked,
    );


  const regionalIds =
    getSelectedRegionalIds(
      elements,
    );


  if (!nome) {
    setDialogStatus(
      elements,
      "Informe o nome do instrutor.",
      "error",
    );


    elements.name.focus();


    return;
  }


  /*
   * A partir de agora todo cadastro novo precisa
   * possuir ao menos uma Regional.
   *
   * Instrutores antigos sem Regional continuarão
   * aparecendo na listagem até serem atualizados.
   */
  if (
    regionalIds.length ===
    0
  ) {
    setDialogStatus(
      elements,
      "Selecione pelo menos uma Regional atendida pelo instrutor.",
      "error",
    );


    return;
  }


  const payload = {
    nome,

    email,

    telefone,

    observacoes,

    ativo,
  };


  elements.save.disabled =
    true;


  elements.save.textContent =
    "Salvando...";


  setDialogStatus(
    elements,
    "Salvando instrutor...",
    "loading",
  );


  try {
    let savedInstructorId;


    if (isEditing) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "instrutores",
          )
          .update(
            payload,
          )
          .eq(
            "id",
            instructorId,
          )
          .select(
            "id",
          )
          .single();


      if (error) {
        throw error;
      }


      savedInstructorId =
        data.id;

    } else {

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "instrutores",
          )
          .insert(
            payload,
          )
          .select(
            "id",
          )
          .single();


      if (error) {
        throw error;
      }


      savedInstructorId =
        data.id;
    }


    /*
     * Sincronização das Regionais.
     *
     * A RPC executa a remoção das relações antigas
     * e inclusão das novas dentro de uma transação
     * do PostgreSQL.
     */
    await syncInstructorRegionals(
      savedInstructorId,
      regionalIds,
    );


    await reloadData();


    render(
      elements,
    );


    closeDialog(
      elements,
    );


    setPageMessage(
      elements,
      isEditing
        ? "Instrutor atualizado com sucesso."
        : "Instrutor cadastrado com sucesso.",
      "success",
    );

  } catch (error) {

    console.error(
      "[YXZ] Não foi possível salvar o instrutor:",
      error,
    );


    if (
      error?.code ===
      "23505"
    ) {
      setDialogStatus(
        elements,
        "Já existe um instrutor utilizando este e-mail.",
        "error",
      );


      return;
    }


    if (
      error?.code ===
      "42501"
    ) {
      setDialogStatus(
        elements,
        "Você não possui permissão para alterar instrutores.",
        "error",
      );


      return;
    }


    setDialogStatus(
      elements,
      error?.message ||
      "Não foi possível salvar o instrutor.",
      "error",
    );

  } finally {

    elements.save.disabled =
      false;


    elements.save.textContent =
      isEditing
        ? "Salvar alterações"
        : "Salvar instrutor";
  }
}


/* =========================================================
   ATIVAR / INATIVAR
========================================================= */

async function toggleInstructorStatus(
  instructorId,
  elements,
) {
  const instructor =
    getInstructorById(
      instructorId,
    );


  if (!instructor) {
    return;
  }


  const newStatus =
    !instructor.ativo;


  if (
    !newStatus
  ) {
    const confirmed =
      window.confirm(
        `Deseja inativar o instrutor "${instructor.nome}"?`,
      );


    if (!confirmed) {
      return;
    }
  }


  try {
    setPageMessage(
      elements,
      newStatus
        ? "Ativando instrutor..."
        : "Inativando instrutor...",
      "loading",
    );


    const {
      error,
    } =
      await supabase
        .from(
          "instrutores",
        )
        .update({
          ativo:
            newStatus,
        })
        .eq(
          "id",
          instructor.id,
        );


    if (error) {
      throw error;
    }


    await loadInstructors();


    render(
      elements,
    );


    setPageMessage(
      elements,
      newStatus
        ? "Instrutor ativado com sucesso."
        : "Instrutor inativado com sucesso.",
      "success",
    );

  } catch (error) {

    console.error(
      "[YXZ] Não foi possível alterar o status do instrutor:",
      error,
    );


    setPageMessage(
      elements,
      "Não foi possível alterar o status do instrutor.",
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
  elements.newButton
    ?.addEventListener(
      "click",
      () => {
        openCreateDialog(
          elements,
        );
      },
    );


  elements.closeButtons
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            closeDialog(
              elements,
            );
          },
        );
      },
    );


  elements.form
    ?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();


        await saveInstructor(
          elements,
        );
      },
    );


  elements.search
    ?.addEventListener(
      "input",
      () => {
        renderTable(
          elements,
        );
      },
    );


  elements.statusFilter
    ?.addEventListener(
      "change",
      () => {
        renderTable(
          elements,
        );
      },
    );


  elements.regionalFilter
    ?.addEventListener(
      "change",
      () => {
        renderTable(
          elements,
        );
      },
    );


  elements.dialog
    ?.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          elements.dialog
        ) {
          closeDialog(
            elements,
          );
        }
      },
    );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

export async function initInstrutoresPage() {
  const elements =
    getElements();


  bindEvents(
    elements,
  );


  try {
    setPageMessage(
      elements,
      "Carregando instrutores...",
      "loading",
    );


    await Promise.all([
      loadInstructors(),
      loadRegionals(),
      loadInstructorRegionals(),
    ]);


    renderRegionalCheckboxes(
      elements,
    );


    render(
      elements,
    );


    setPageMessage(
      elements,
      "",
    );

  } catch (error) {

    console.error(
      "[YXZ] Não foi possível carregar os instrutores:",
      error,
    );


    elements.tableBody
      ?.replaceChildren();


    setPageMessage(
      elements,
      "Não foi possível carregar o módulo de Instrutores.",
      "error",
    );
  }
}