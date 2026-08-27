import {
  supabase,
} from "./supabase.js";


let instructors = [];

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

    search:
      document.querySelector(
        "[data-instructors-search]",
      ),

    statusFilter:
      document.querySelector(
        "[data-instructors-status-filter]",
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

    activeControl:
      document.querySelector(
        "[data-instructor-active]",
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

function normalizeSearchText(
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


function getInitials(
  name,
) {
  const words =
    String(
      name || "",
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (!words.length) {
    return "YX";
  }


  if (
    words.length ===
    1
  ) {
    return words[0]
      .slice(
        0,
        2,
      )
      .toUpperCase();
  }


  return (
    words[0][0] +
    words[
      words.length - 1
    ][0]
  ).toUpperCase();
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
   DADOS
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
    total - active;


  if (elements.total) {
    elements.total.textContent =
      String(total);
  }


  if (elements.active) {
    elements.active.textContent =
      String(active);
  }


  if (elements.inactive) {
    elements.inactive.textContent =
      String(inactive);
  }
}


/* =========================================================
   FILTROS
========================================================= */

function getFilteredInstructors(
  elements,
) {
  const search =
    normalizeSearchText(
      elements.search
        ?.value,
    );


  const status =
    elements.statusFilter
      ?.value ||
    "all";


  return instructors.filter(
    (instructor) => {
      const searchable =
        normalizeSearchText(
          [
            instructor.nome,
            instructor.email,
            instructor.telefone,
          ].join(" "),
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


      return (
        matchesSearch &&
        matchesStatus
      );
    },
  );
}


/* =========================================================
   TABELA
========================================================= */

function createInstructorCell(
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
    "instructors-person";


  const avatar =
    document.createElement(
      "span",
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


  const caption =
    document.createElement(
      "span",
    );

  caption.textContent =
    instructor.profile_id
      ? "Conta vinculada"
      : "Sem acesso ao portal";


  info.append(
    name,
    caption,
  );


  wrapper.append(
    avatar,
    info,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


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


  const email =
    document.createElement(
      "span",
    );

  email.textContent =
    instructor.email ||
    "E-mail não informado";


  const phone =
    document.createElement(
      "small",
    );

  phone.textContent =
    instructor.telefone ||
    "Telefone não informado";


  wrapper.append(
    email,
    phone,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


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
      ? (
        "instructors-status " +
        "instructors-status-active"
      )
      : (
        "instructors-status " +
        "instructors-status-inactive"
      );


  badge.textContent =
    instructor.ativo
      ? "Ativo"
      : "Inativo";


  cell.append(
    badge,
  );


  return cell;
}


function createActionCell(
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


  const editButton =
    document.createElement(
      "button",
    );


  editButton.type =
    "button";

  editButton.className =
    "btn btn-ghost";

  editButton.textContent =
    "Editar";


  editButton.addEventListener(
    "click",
    () => {
      openEditDialog(
        instructor.id,
        elements,
      );
    },
  );


  const statusButton =
    document.createElement(
      "button",
    );


  statusButton.type =
    "button";

  statusButton.className =
    "btn btn-ghost";


  statusButton.textContent =
    instructor.ativo
      ? "Inativar"
      : "Ativar";


  statusButton.addEventListener(
    "click",
    async () => {
      await toggleInstructorStatus(
        instructor,
        statusButton,
        elements,
      );
    },
  );


  actions.append(
    editButton,
    statusButton,
  );


  cell.append(
    actions,
  );


  return cell;
}


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
      filtered.length > 0;
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

        createStatusCell(
          instructor,
        ),

        createActionCell(
          instructor,
          elements,
        ),
      );


      elements.tableBody
        .append(
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


  renderTable(
    elements,
  );
}


/* =========================================================
   NOVO INSTRUTOR
========================================================= */

function openCreateDialog(
  elements,
) {
  selectedInstructorId =
    null;


  elements.form
    ?.reset();


  if (
    elements.activeControl
  ) {
    elements.activeControl.checked =
      true;
  }


  if (
    elements.dialogKicker
  ) {
    elements.dialogKicker.textContent =
      "Novo cadastro";
  }


  if (
    elements.dialogTitle
  ) {
    elements.dialogTitle.textContent =
      "Novo instrutor";
  }


  if (
    elements.save
  ) {
    elements.save.textContent =
      "Salvar instrutor";
  }


  setDialogStatus(
    elements,
  );


  elements.dialog
    ?.showModal();


  requestAnimationFrame(
    () => {
      elements.name
        ?.focus();
    },
  );
}


/* =========================================================
   EDITAR INSTRUTOR
========================================================= */

function getSelectedInstructor() {
  return (
    instructors.find(
      (instructor) =>
        instructor.id ===
        selectedInstructorId,
    ) ||
    null
  );
}


function openEditDialog(
  instructorId,
  elements,
) {
  const instructor =
    instructors.find(
      (item) =>
        item.id ===
        instructorId,
    );


  if (
    !instructor ||
    !elements.dialog
  ) {
    return;
  }


  selectedInstructorId =
    instructor.id;


  if (
    elements.dialogKicker
  ) {
    elements.dialogKicker.textContent =
      "Cadastro existente";
  }


  if (
    elements.dialogTitle
  ) {
    elements.dialogTitle.textContent =
      "Editar instrutor";
  }


  if (
    elements.name
  ) {
    elements.name.value =
      instructor.nome ||
      "";
  }


  if (
    elements.email
  ) {
    elements.email.value =
      instructor.email ||
      "";
  }


  if (
    elements.phone
  ) {
    elements.phone.value =
      instructor.telefone ||
      "";
  }


  if (
    elements.notes
  ) {
    elements.notes.value =
      instructor.observacoes ||
      "";
  }


  if (
    elements.activeControl
  ) {
    elements.activeControl.checked =
      Boolean(
        instructor.ativo,
      );
  }


  if (
    elements.save
  ) {
    elements.save.textContent =
      "Salvar alterações";
  }


  setDialogStatus(
    elements,
  );


  elements.dialog.showModal();


  requestAnimationFrame(
    () => {
      elements.name
        ?.focus();
    },
  );
}


/* =========================================================
   FECHAR
========================================================= */

function closeDialog(
  elements,
) {
  selectedInstructorId =
    null;


  if (
    elements.dialog
      ?.open
  ) {
    elements.dialog.close();
  }


  setDialogStatus(
    elements,
  );
}


/* =========================================================
   ERROS
========================================================= */

function getDatabaseErrorMessage(
  error,
) {
  if (
    error?.code ===
    "23505"
  ) {
    return (
      "Já existe um instrutor cadastrado com este e-mail."
    );
  }


  if (
    error?.code ===
    "42501"
  ) {
    return (
      "Você não possui permissão para realizar esta operação."
    );
  }


  return (
    "Não foi possível salvar o instrutor."
  );
}


/* =========================================================
   SALVAR
========================================================= */

async function saveInstructor(
  elements,
) {
  const nome =
    elements.name
      ?.value
      .trim() ||
    "";


  const email =
    normalizeOptionalText(
      elements.email
        ?.value,
    );


  const telefone =
    normalizeOptionalText(
      elements.phone
        ?.value,
    );


  const observacoes =
    normalizeOptionalText(
      elements.notes
        ?.value,
    );


  const ativo =
    Boolean(
      elements.activeControl
        ?.checked,
    );


  if (!nome) {
    setDialogStatus(
      elements,
      "Informe o nome do instrutor.",
      "error",
    );


    elements.name
      ?.focus();


    return;
  }


  const isEditing =
    Boolean(
      selectedInstructorId,
    );


  const instructorId =
    selectedInstructorId;


  if (
    elements.save
  ) {
    elements.save.disabled =
      true;


    elements.save.textContent =
      "Salvando...";
  }


  setDialogStatus(
    elements,
    "Salvando instrutor...",
    "loading",
  );


  const payload = {
    nome,

    email,

    telefone,

    observacoes,

    ativo,
  };


  try {
    let result;


    if (
      isEditing
    ) {
      result =
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
          .single();

    } else {

      result =
        await supabase
          .from(
            "instrutores",
          )
          .insert(
            payload,
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
          .single();
    }


    if (
      result.error
    ) {
      throw result.error;
    }


    await loadInstructors();


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


    setDialogStatus(
      elements,
      getDatabaseErrorMessage(
        error,
      ),
      "error",
    );

  } finally {
    if (
      elements.save
    ) {
      elements.save.disabled =
        false;


      elements.save.textContent =
        isEditing
          ? "Salvar alterações"
          : "Salvar instrutor";
    }
  }
}


/* =========================================================
   ATIVAR / INATIVAR
========================================================= */

async function toggleInstructorStatus(
  instructor,
  button,
  elements,
) {
  const nextStatus =
    !instructor.ativo;


  if (
    !nextStatus
  ) {
    const confirmed =
      window.confirm(
        (
          `Deseja inativar ${instructor.nome}? ` +
          "O instrutor deixará de aparecer em novas escalas."
        ),
      );


    if (!confirmed) {
      return;
    }
  }


  const originalText =
    button.textContent;


  button.disabled =
    true;


  button.textContent =
    nextStatus
      ? "Ativando..."
      : "Inativando...";


  try {
    const {
      error,
    } =
      await supabase
        .from(
          "instrutores",
        )
        .update({
          ativo:
            nextStatus,
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
      nextStatus
        ? (
          `${instructor.nome} foi ativado.`
        )
        : (
          `${instructor.nome} foi inativado.`
        ),
      "success",
    );

  } catch (error) {
    console.error(
      "[YXZ] Não foi possível alterar o status do instrutor:",
      error,
    );


    button.disabled =
      false;


    button.textContent =
      originalText;


    setPageMessage(
      elements,
      (
        "Não foi possível alterar o status " +
        "do instrutor."
      ),
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


    await loadInstructors();


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


    if (
      elements.tableBody
    ) {
      elements.tableBody
        .replaceChildren();
    }


    setPageMessage(
      elements,
      (
        "Não foi possível carregar " +
        "a lista de instrutores."
      ),
      "error",
    );
  }
}