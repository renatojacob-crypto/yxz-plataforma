import {
  supabase,
} from "./supabase.js";

import {
  getCurrentUser,
} from "./auth.js";


const PROFILE_MASTER =
  "administrador_master";


const PROFILE_LABELS = {
  administrador_master:
    "Administrador Master",

  administrador:
    "Administrador",

  educador_social:
    "Educador Social",

  coordenador:
    "Coordenador",

  instrutor:
    "Instrutor",
};


const collator =
  new Intl.Collator(
    "pt-BR",
    {
      sensitivity:
        "base",
    },
  );


let profiles = [];

let selectedProfileId =
  null;


/* =========================================================
   ELEMENTOS
========================================================= */

function getElements() {
  return {
    message:
      document.querySelector(
        "[data-users-message]",
      ),

    total:
      document.querySelector(
        "[data-users-total]",
      ),

    active:
      document.querySelector(
        "[data-users-active]",
      ),

    inactive:
      document.querySelector(
        "[data-users-inactive]",
      ),

    search:
      document.querySelector(
        "[data-users-search]",
      ),

    profileFilter:
      document.querySelector(
        "[data-users-profile-filter]",
      ),

    statusFilter:
      document.querySelector(
        "[data-users-status-filter]",
      ),

    tableBody:
      document.querySelector(
        "[data-users-table-body]",
      ),

    empty:
      document.querySelector(
        "[data-users-empty]",
      ),

    newUserButton:
      document.querySelector(
        "[data-new-user]",
      ),


    /* NOVO USUÁRIO */

    createDialog:
      document.getElementById(
        "userCreateDialog",
      ),

    createForm:
      document.getElementById(
        "userCreateForm",
      ),

    createName:
      document.querySelector(
        "[data-create-name]",
      ),

    createEmail:
      document.querySelector(
        "[data-create-email]",
      ),

    createCargo:
      document.querySelector(
        "[data-create-cargo]",
      ),

    createProfile:
      document.querySelector(
        "[data-create-profile]",
      ),

    createStatus:
      document.querySelector(
        "[data-create-status]",
      ),

    createSubmit:
      document.querySelector(
        "[data-create-submit]",
      ),

    createCloseButtons:
      document.querySelectorAll(
        "[data-create-dialog-close]",
      ),


    /* EDIÇÃO */

    editDialog:
      document.getElementById(
        "userEditDialog",
      ),

    editForm:
      document.getElementById(
        "userEditForm",
      ),

    editEmail:
      document.querySelector(
        "[data-edit-email]",
      ),

    editName:
      document.querySelector(
        "[data-edit-name]",
      ),

    editCargo:
      document.querySelector(
        "[data-edit-cargo]",
      ),

    editProfile:
      document.querySelector(
        "[data-edit-profile]",
      ),

    editActive:
      document.querySelector(
        "[data-edit-active]",
      ),

    editActiveHelp:
      document.querySelector(
        "[data-edit-active-help]",
      ),

    editManagerStatus:
      document.querySelector(
        "[data-edit-manager-status]",
      ),

    editStatus:
      document.querySelector(
        "[data-edit-status]",
      ),

    editSave:
      document.querySelector(
        "[data-edit-save]",
      ),

    resetPassword:
      document.querySelector(
        "[data-reset-password]",
      ),

    editCloseButtons:
      document.querySelectorAll(
        "[data-user-dialog-close]",
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
    .toLowerCase()
    .trim();
}


function getProfileLabel(
  profile,
) {
  return (
    PROFILE_LABELS[
      profile
    ] ||
    "Usuário"
  );
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


function setCreateStatus(
  elements,
  message = "",
  state = "",
) {
  if (!elements.createStatus) {
    return;
  }


  elements.createStatus.textContent =
    message;


  elements.createStatus.dataset.state =
    state;
}


function setEditStatus(
  elements,
  message = "",
  state = "",
) {
  if (!elements.editStatus) {
    return;
  }


  elements.editStatus.textContent =
    message;


  elements.editStatus.dataset.state =
    state;
}


function getPasswordResetRedirectUrl() {
  return new URL(
    "/app/redefinir-senha.html",
    window.location.origin,
  ).href;
}


/* =========================================================
   DADOS
========================================================= */

async function loadProfiles() {
  const {
    data,
    error,
  } =
    await supabase
      .from("profiles")
      .select(`
        id,
        nome,
        email,
        cargo,
        perfil,
        ativo,
        avatar_url,
        pode_gerenciar_usuarios,
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


  profiles =
    Array.isArray(data)
      ? data
      : [];


  profiles.sort(
    (a, b) =>
      collator.compare(
        a.nome || "",
        b.nome || "",
      ),
  );
}


/* =========================================================
   RESUMO
========================================================= */

function renderSummary(
  elements,
) {
  const total =
    profiles.length;


  const active =
    profiles.filter(
      (profile) =>
        profile.ativo,
    ).length;


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
      String(
        total - active,
      );
  }
}


/* =========================================================
   FILTROS
========================================================= */

function getFilteredProfiles(
  elements,
) {
  const search =
    normalizeText(
      elements.search?.value,
    );


  const selectedProfile =
    elements.profileFilter
      ?.value ||
    "all";


  const selectedStatus =
    elements.statusFilter
      ?.value ||
    "all";


  return profiles.filter(
    (profile) => {
      const searchable =
        normalizeText(
          [
            profile.nome,
            profile.email,
            profile.cargo,
          ].join(" "),
        );


      const matchesSearch =
        !search ||
        searchable.includes(
          search,
        );


      const matchesProfile =
        selectedProfile ===
          "all" ||
        profile.perfil ===
          selectedProfile;


      const matchesStatus =
        selectedStatus ===
          "all" ||
        (
          selectedStatus ===
            "active" &&
          profile.ativo
        ) ||
        (
          selectedStatus ===
            "inactive" &&
          !profile.ativo
        );


      return (
        matchesSearch &&
        matchesProfile &&
        matchesStatus
      );
    },
  );
}


/* =========================================================
   TABELA
========================================================= */

function createTextCell(
  text,
) {
  const cell =
    document.createElement(
      "td",
    );


  cell.textContent =
    text;


  return cell;
}


function createUserCell(
  profile,
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
    "users-person";


  const avatar =
    document.createElement(
      "span",
    );

  avatar.className =
    "users-person-avatar";

  avatar.textContent =
    getInitials(
      profile.nome,
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
    profile.nome ||
    "Sem nome";


  const email =
    document.createElement(
      "span",
    );

  email.textContent =
    profile.email ||
    "Sem e-mail";


  info.append(
    name,
    email,
  );


  if (
    profile
      .pode_gerenciar_usuarios
  ) {
    const badge =
      document.createElement(
        "small",
      );

    badge.className =
      "users-manager-badge";

    badge.textContent =
      "Gestão de usuários";


    info.append(
      badge,
    );
  }


  wrapper.append(
    avatar,
    info,
  );


  cell.append(
    wrapper,
  );


  return cell;
}


function createProfileCell(
  profile,
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
    "users-profile-badge";

  badge.textContent =
    getProfileLabel(
      profile.perfil,
    );


  cell.append(
    badge,
  );


  return cell;
}


function createStatusCell(
  profile,
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
    profile.ativo
      ? (
        "users-status " +
        "users-status-active"
      )
      : (
        "users-status " +
        "users-status-inactive"
      );


  badge.textContent =
    profile.ativo
      ? "Ativo"
      : "Inativo";


  cell.append(
    badge,
  );


  return cell;
}


function createActionCell(
  profile,
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
    "btn btn-ghost users-edit-button";

  button.textContent =
    "Editar";


  button.addEventListener(
    "click",
    () => {
      openEditDialog(
        profile.id,
        elements,
      );
    },
  );


  cell.append(
    button,
  );


  return cell;
}


function renderTable(
  elements,
) {
  if (
    !elements.tableBody
  ) {
    return;
  }


  const filtered =
    getFilteredProfiles(
      elements,
    );


  elements.tableBody
    .replaceChildren();


  if (elements.empty) {
    elements.empty.hidden =
      filtered.length > 0;
  }


  filtered.forEach(
    (profile) => {
      const row =
        document.createElement(
          "tr",
        );


      row.append(
        createUserCell(
          profile,
        ),

        createTextCell(
          profile.cargo ||
          "Colaborador",
        ),

        createProfileCell(
          profile,
        ),

        createStatusCell(
          profile,
        ),

        createActionCell(
          profile,
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
   NOVO USUÁRIO
========================================================= */

function resetCreateForm(
  elements,
) {
  elements.createForm
    ?.reset();


  if (
    elements.createProfile
  ) {
    elements.createProfile.value =
      "educador_social";
  }


  setCreateStatus(
    elements,
  );
}


function openCreateDialog(
  elements,
) {
  if (
    !elements.createDialog
  ) {
    return;
  }


  resetCreateForm(
    elements,
  );


  elements.createDialog
    .showModal();


  requestAnimationFrame(
    () => {
      elements.createName
        ?.focus();
    },
  );
}


function closeCreateDialog(
  elements,
) {
  if (
    elements.createDialog
      ?.open
  ) {
    elements.createDialog.close();
  }


  setCreateStatus(
    elements,
  );
}


/* =========================================================
   ERRO DA EDGE FUNCTION
========================================================= */

async function getFunctionErrorMessage(
  error,
) {
  let responseData =
    null;


  try {
    if (
      error?.context &&
      typeof error.context.json ===
        "function"
    ) {
      responseData =
        await error.context
          .json();
    }
  } catch {
    responseData =
      null;
  }


  const code =
    responseData?.code ||
    "";


  switch (code) {

    case "forbidden":
      return (
        "Você não possui permissão para criar usuários."
      );


    case "user_already_exists":
      return (
        "Já existe uma conta cadastrada com esse e-mail."
      );


    case "invalid_email":
      return (
        "Informe um e-mail válido."
      );


    case "name_required":
      return (
        "Informe o nome do usuário."
      );


    case "role_required":
      return (
        "Informe o cargo do usuário."
      );


    case "invalid_profile":
      return (
        "Este perfil não pode ser criado pela Central de Usuários."
      );


    case "invite_redirect_missing":
      return (
        "O endereço de ativação da conta não está configurado."
      );


    default:
      return (
        responseData?.message ||
        "Não foi possível criar o usuário."
      );
  }
}


/* =========================================================
   CRIAR USUÁRIO
========================================================= */

async function createUser(
  elements,
) {
  const nome =
    elements.createName
      ?.value
      .trim() ||
    "";


  const email =
    elements.createEmail
      ?.value
      .trim()
      .toLowerCase() ||
    "";


  const cargo =
    elements.createCargo
      ?.value
      .trim() ||
    "";


  const perfil =
    elements.createProfile
      ?.value ||
    "educador_social";


  if (!nome) {
    setCreateStatus(
      elements,
      "Informe o nome do usuário.",
      "error",
    );

    elements.createName
      ?.focus();

    return;
  }


  if (!email) {
    setCreateStatus(
      elements,
      "Informe o e-mail do usuário.",
      "error",
    );

    elements.createEmail
      ?.focus();

    return;
  }


  if (!cargo) {
    setCreateStatus(
      elements,
      "Informe o cargo do usuário.",
      "error",
    );

    elements.createCargo
      ?.focus();

    return;
  }


  if (
    elements.createSubmit
  ) {
    elements.createSubmit.disabled =
      true;

    elements.createSubmit.textContent =
      "Enviando...";
  }


  setCreateStatus(
    elements,
    "Criando usuário e enviando convite...",
    "loading",
  );


  try {
    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke(
          "invite-user",
          {
            body: {
              nome,
              email,
              cargo,
              perfil,
            },
          },
        );


    if (error) {
      throw new Error(
        await getFunctionErrorMessage(
          error,
        ),
      );
    }


    if (!data?.ok) {
      throw new Error(
        data?.message ||
        "Não foi possível criar o usuário.",
      );
    }


    await loadProfiles();

    render(
      elements,
    );


    closeCreateDialog(
      elements,
    );


    setPageMessage(
      elements,
      data.warning
        ? data.message
        : `Convite enviado para ${email}.`,
      data.warning
        ? "info"
        : "success",
    );

  } catch (error) {
    console.error(
      "[YXZ] Não foi possível criar o usuário:",
      error,
    );


    setCreateStatus(
      elements,
      error?.message ||
      "Não foi possível enviar o convite.",
      "error",
    );

  } finally {
    if (
      elements.createSubmit
    ) {
      elements.createSubmit.disabled =
        false;

      elements.createSubmit.textContent =
        "Enviar convite";
    }
  }
}


/* =========================================================
   EDIÇÃO
========================================================= */

function getSelectedProfile() {
  return (
    profiles.find(
      (profile) =>
        profile.id ===
        selectedProfileId,
    ) ||
    null
  );
}


function openEditDialog(
  profileId,
  elements,
) {
  const profile =
    profiles.find(
      (item) =>
        item.id ===
        profileId,
    );


  if (
    !profile ||
    !elements.editDialog
  ) {
    return;
  }


  selectedProfileId =
    profile.id;


  if (elements.editEmail) {
    elements.editEmail.value =
      profile.email ||
      "";
  }


  if (elements.editName) {
    elements.editName.value =
      profile.nome ||
      "";
  }


  if (elements.editCargo) {
    elements.editCargo.value =
      profile.cargo ||
      "";
  }


  if (elements.editProfile) {
    elements.editProfile.value =
      profile.perfil;


    /*
     * O Master não pode ser rebaixado
     * acidentalmente por esta tela.
     */
    elements.editProfile.disabled =
      profile.perfil ===
      PROFILE_MASTER;
  }


  if (
    elements.editManagerStatus
  ) {
    elements
      .editManagerStatus
      .textContent =
        profile
          .pode_gerenciar_usuarios
          ? "Autorizado"
          : "Não autorizado";
  }


  if (elements.editActive) {
    elements.editActive.checked =
      Boolean(
        profile.ativo,
      );


    elements.editActive.disabled =
      Boolean(
        profile
          .pode_gerenciar_usuarios,
      );
  }


  if (
    elements.editActiveHelp
  ) {
    elements
      .editActiveHelp
      .textContent =
        profile
          .pode_gerenciar_usuarios
          ? (
            "A conta Master responsável pela gestão " +
            "de usuários não pode ser desativada nesta tela."
          )
          : (
            "Usuários inativos não conseguem acessar o portal."
          );
  }


  if (
    elements.resetPassword
  ) {
    elements.resetPassword.disabled =
      !profile.email;
  }


  setEditStatus(
    elements,
  );


  elements.editDialog
    .showModal();


  requestAnimationFrame(
    () => {
      elements.editName
        ?.focus();
    },
  );
}


function closeEditDialog(
  elements,
) {
  selectedProfileId =
    null;


  if (
    elements.editDialog
      ?.open
  ) {
    elements.editDialog.close();
  }


  if (
    elements.editProfile
  ) {
    elements.editProfile.disabled =
      false;
  }


  setEditStatus(
    elements,
  );
}


/* =========================================================
   REDEFINIÇÃO DE SENHA
========================================================= */

async function sendPasswordReset(
  elements,
) {
  const current =
    getSelectedProfile();


  if (
    !current?.email
  ) {
    setEditStatus(
      elements,
      "Este usuário não possui um e-mail válido.",
      "error",
    );

    return;
  }


  const originalText =
    elements.resetPassword
      ?.textContent ||
    "Enviar redefinição";


  if (
    elements.resetPassword
  ) {
    elements.resetPassword.disabled =
      true;

    elements.resetPassword.textContent =
      "Enviando...";
  }


  setEditStatus(
    elements,
    "Enviando e-mail de redefinição...",
    "loading",
  );


  try {
    const {
      error,
    } =
      await supabase.auth
        .resetPasswordForEmail(
          current.email,
          {
            redirectTo:
              getPasswordResetRedirectUrl(),
          },
        );


    if (error) {
      throw error;
    }


    setEditStatus(
      elements,
      (
        "E-mail de redefinição enviado para " +
        current.email +
        "."
      ),
      "success",
    );

  } catch (error) {
    console.error(
      "[YXZ] Não foi possível enviar a redefinição:",
      error,
    );


    setEditStatus(
      elements,
      "Não foi possível enviar o e-mail de redefinição.",
      "error",
    );

  } finally {
    if (
      elements.resetPassword
    ) {
      elements.resetPassword.disabled =
        false;

      elements.resetPassword.textContent =
        originalText;
    }
  }
}


/* =========================================================
   SALVAR PROFILE
========================================================= */

async function saveProfile(
  elements,
) {
  const current =
    getSelectedProfile();


  if (!current) {
    return;
  }


  const nome =
    elements.editName
      ?.value
      .trim() ||
    "";


  const cargo =
    elements.editCargo
      ?.value
      .trim() ||
    "";


  /*
   * Se for Master, sempre preservamos
   * o perfil original.
   */
  const perfil =
    current.perfil ===
      PROFILE_MASTER
      ? PROFILE_MASTER
      : (
        elements.editProfile
          ?.value ||
        "educador_social"
      );


  /*
   * Ninguém pode ser promovido a Master
   * através deste formulário.
   */
  if (
    perfil ===
      PROFILE_MASTER &&
    current.perfil !==
      PROFILE_MASTER
  ) {
    setEditStatus(
      elements,
      "Administrador Master não pode ser atribuído por esta tela.",
      "error",
    );

    return;
  }


  if (!nome) {
    setEditStatus(
      elements,
      "Informe o nome do usuário.",
      "error",
    );

    return;
  }


  if (!cargo) {
    setEditStatus(
      elements,
      "Informe o cargo do usuário.",
      "error",
    );

    return;
  }


  const ativo =
    current
      .pode_gerenciar_usuarios
      ? true
      : Boolean(
        elements.editActive
          ?.checked,
      );


  if (
    elements.editSave
  ) {
    elements.editSave.disabled =
      true;

    elements.editSave.textContent =
      "Salvando...";
  }


  setEditStatus(
    elements,
    "Salvando alterações...",
    "loading",
  );


  try {
    const {
      data,
      error,
    } =
      await supabase
        .from("profiles")
        .update({
          nome,
          cargo,
          perfil,
          ativo,
        })
        .eq(
          "id",
          current.id,
        )
        .select(`
          id,
          nome,
          email,
          cargo,
          perfil,
          ativo,
          avatar_url,
          pode_gerenciar_usuarios,
          created_at,
          updated_at
        `)
        .single();


    if (error) {
      throw error;
    }


    profiles =
      profiles.map(
        (profile) =>
          profile.id ===
            data.id
            ? data
            : profile,
      );


    profiles.sort(
      (a, b) =>
        collator.compare(
          a.nome || "",
          b.nome || "",
        ),
    );


    render(
      elements,
    );


    closeEditDialog(
      elements,
    );


    setPageMessage(
      elements,
      "Usuário atualizado com sucesso.",
      "success",
    );

  } catch (error) {
    console.error(
      "[YXZ] Não foi possível atualizar o usuário:",
      error,
    );


    setEditStatus(
      elements,
      "Não foi possível salvar as alterações.",
      "error",
    );

  } finally {
    if (
      elements.editSave
    ) {
      elements.editSave.disabled =
        false;

      elements.editSave.textContent =
        "Salvar alterações";
    }
  }
}


/* =========================================================
   EVENTOS
========================================================= */

function bindFilters(
  elements,
) {
  elements.search
    ?.addEventListener(
      "input",
      () => {
        renderTable(
          elements,
        );
      },
    );


  elements.profileFilter
    ?.addEventListener(
      "change",
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
}


function bindCreateDialog(
  elements,
) {
  elements.newUserButton
    ?.addEventListener(
      "click",
      () => {
        openCreateDialog(
          elements,
        );
      },
    );


  elements.createCloseButtons
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            closeCreateDialog(
              elements,
            );
          },
        );
      },
    );


  elements.createForm
    ?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        await createUser(
          elements,
        );
      },
    );
}


function bindEditDialog(
  elements,
) {
  elements.editCloseButtons
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            closeEditDialog(
              elements,
            );
          },
        );
      },
    );


  elements.editForm
    ?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        await saveProfile(
          elements,
        );
      },
    );


  elements.resetPassword
    ?.addEventListener(
      "click",
      async () => {
        await sendPasswordReset(
          elements,
        );
      },
    );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

export async function initUsuariosPage() {
  const elements =
    getElements();


  const currentUser =
    getCurrentUser();


  if (!currentUser) {
    return;
  }


  bindFilters(
    elements,
  );

  bindCreateDialog(
    elements,
  );

  bindEditDialog(
    elements,
  );


  try {
    setPageMessage(
      elements,
      "Carregando usuários...",
      "loading",
    );


    await loadProfiles();

    render(
      elements,
    );


    setPageMessage(
      elements,
      "",
    );

  } catch (error) {
    console.error(
      "[YXZ] Não foi possível carregar os usuários:",
      error,
    );


    setPageMessage(
      elements,
      "Não foi possível carregar a lista de usuários.",
      "error",
    );
  }
}