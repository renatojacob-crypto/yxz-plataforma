import {
  createClient,
} from "npm:@supabase/supabase-js@2";


/* =========================================================
   YXZ PLATAFORMA
   EVIDÊNCIAS FOTOGRÁFICAS
   GOOGLE DRIVE
========================================================= */


const DRIVE_FOLDER_MIME =
  "application/vnd.google-apps.folder";


const ALLOWED_MIME_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);


const MAX_FILE_SIZE =
  5 * 1024 * 1024;


const MONTH_NAMES = [
  "",
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];


const corsHeaders = {
  "Access-Control-Allow-Origin":
    "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "GET, POST, DELETE, OPTIONS",

  "Access-Control-Expose-Headers":
    "x-yxz-mime-type",
};


/* =========================================================
   ERRO HTTP
========================================================= */

class HttpError extends Error {

  status: number;


  constructor(
    status: number,
    message: string,
  ) {
    super(
      message,
    );


    this.status =
      status;
  }
}


/* =========================================================
   RESPOSTA JSON
========================================================= */

function jsonResponse(
  data: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(
      data,
    ),
    {
      status,

      headers: {
        ...corsHeaders,

        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}


/* =========================================================
   ENV
========================================================= */

function requireEnv(
  name: string,
) {
  const value =
    Deno.env.get(
      name,
    );


  if (!value) {
    throw new Error(
      `Secret obrigatório não configurado: ${name}`,
    );
  }


  return value;
}


/* =========================================================
   CHAVE PÚBLICA DO SUPABASE
========================================================= */

function getSupabasePublishableKey() {

  const modernKeys =
    Deno.env.get(
      "SUPABASE_PUBLISHABLE_KEYS",
    );


  if (modernKeys) {

    try {

      const parsed =
        JSON.parse(
          modernKeys,
        );


      if (
        typeof parsed.default ===
        "string"
      ) {
        return parsed.default;
      }


      const firstKey =
        Object.values(
          parsed,
        ).find(
          (value) =>
            typeof value ===
            "string",
        );


      if (
        typeof firstKey ===
        "string"
      ) {
        return firstKey;
      }

    } catch (
      error
    ) {

      console.error(
        "[YXZ] Falha ao interpretar SUPABASE_PUBLISHABLE_KEYS:",
        error,
      );
    }
  }


  const legacyKey =
    Deno.env.get(
      "SUPABASE_ANON_KEY",
    );


  if (legacyKey) {
    return legacyKey;
  }


  throw new Error(
    "Nenhuma publishable key do Supabase foi encontrada.",
  );
}


/* =========================================================
   SUPABASE COM CONTEXTO DO USUÁRIO
========================================================= */

async function createAuthenticatedSupabase(
  request: Request,
) {

  const authorization =
    request.headers.get(
      "Authorization",
    );


  if (!authorization) {
    throw new HttpError(
      401,
      "Sessão não encontrada.",
    );
  }


  const supabase =
    createClient(
      requireEnv(
        "SUPABASE_URL",
      ),

      getSupabasePublishableKey(),

      {
        global: {
          headers: {
            Authorization:
              authorization,
          },
        },

        auth: {
          persistSession:
            false,

          autoRefreshToken:
            false,
        },
      },
    );


  const {
    data: userData,
    error: userError,
  } =
    await supabase.auth
      .getUser();


  if (
    userError ||
    !userData.user
  ) {
    throw new HttpError(
      401,
      "Sessão inválida ou expirada.",
    );
  }


  const {
    data: allowed,
    error: permissionError,
  } =
    await supabase.rpc(
      "can_register_workshop_execution",
    );


  if (permissionError) {
    throw permissionError;
  }


  if (!allowed) {
    throw new HttpError(
      403,
      "Você não possui permissão para gerenciar evidências.",
    );
  }


  return supabase;
}


/* =========================================================
   GOOGLE ACCESS TOKEN
========================================================= */

async function getGoogleAccessToken() {

  const body =
    new URLSearchParams({
      client_id:
        requireEnv(
          "GOOGLE_CLIENT_ID",
        ),

      client_secret:
        requireEnv(
          "GOOGLE_CLIENT_SECRET",
        ),

      refresh_token:
        requireEnv(
          "GOOGLE_REFRESH_TOKEN",
        ),

      grant_type:
        "refresh_token",
    });


  const response =
    await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body,
      },
    );


  if (!response.ok) {

    console.error(
      "[YXZ] Falha ao renovar token Google:",
      await response.text(),
    );


    throw new HttpError(
      502,
      "Não foi possível autenticar no Google Drive.",
    );
  }


  const data =
    await response.json();


  if (!data.access_token) {
    throw new HttpError(
      502,
      "O Google não retornou um access token.",
    );
  }


  return data.access_token as string;
}


/* =========================================================
   NOMES DE PASTAS
========================================================= */

function sanitizeDriveName(
  value: string,
) {
  const cleaned =
    String(
      value || "",
    )
      .replace(
        /[\u0000-\u001f]/g,
        " ",
      )
      .replace(
        /[\\/:*?"<>|]/g,
        "-",
      )
      .replace(
        /\s+/g,
        " ",
      )
      .trim();


  return (
    cleaned ||
    "Sem nome"
  ).slice(
    0,
    160,
  );
}


function escapeDriveQuery(
  value: string,
) {
  return value
    .replace(
      /\\/g,
      "\\\\",
    )
    .replace(
      /'/g,
      "\\'",
    );
}


/* =========================================================
   BUSCAR PASTA
========================================================= */

async function findFolder(
  accessToken: string,
  parentId: string,
  name: string,
) {

  const query =
    [
      `'${escapeDriveQuery(parentId)}' in parents`,

      `name = '${escapeDriveQuery(name)}'`,

      `mimeType = '${DRIVE_FOLDER_MIME}'`,

      "trashed = false",
    ].join(
      " and ",
    );


  const url =
    new URL(
      "https://www.googleapis.com/drive/v3/files",
    );


  url.searchParams.set(
    "q",
    query,
  );


  url.searchParams.set(
    "spaces",
    "drive",
  );


  url.searchParams.set(
    "pageSize",
    "1",
  );


  url.searchParams.set(
    "fields",
    "files(id,name)",
  );


  url.searchParams.set(
    "includeItemsFromAllDrives",
    "true",
  );


  url.searchParams.set(
    "supportsAllDrives",
    "true",
  );


  const response =
    await fetch(
      url,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    );


  if (!response.ok) {

    console.error(
      "[YXZ] Falha ao localizar pasta:",
      await response.text(),
    );


    throw new HttpError(
      502,
      "Não foi possível consultar as pastas do Google Drive.",
    );
  }


  const data =
    await response.json();


  return (
    data.files?.[0] ||
    null
  );
}


/* =========================================================
   CRIAR PASTA
========================================================= */

async function createFolder(
  accessToken: string,
  parentId: string,
  name: string,
) {

  const url =
    new URL(
      "https://www.googleapis.com/drive/v3/files",
    );


  url.searchParams.set(
    "supportsAllDrives",
    "true",
  );


  url.searchParams.set(
    "fields",
    "id,name",
  );


  const response =
    await fetch(
      url,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json; charset=utf-8",
        },

        body:
          JSON.stringify({
            name,

            mimeType:
              DRIVE_FOLDER_MIME,

            parents: [
              parentId,
            ],
          }),
      },
    );


  if (!response.ok) {

    console.error(
      "[YXZ] Falha ao criar pasta:",
      await response.text(),
    );


    throw new HttpError(
      502,
      `Não foi possível criar a pasta "${name}" no Google Drive.`,
    );
  }


  return await response.json();
}


/* =========================================================
   GARANTIR PASTA
========================================================= */

async function ensureFolder(
  accessToken: string,
  parentId: string,
  name: string,
) {

  const existing =
    await findFolder(
      accessToken,
      parentId,
      name,
    );


  if (existing) {
    return existing.id as string;
  }


  const created =
    await createFolder(
      accessToken,
      parentId,
      name,
    );


  return created.id as string;
}


/* =========================================================
   CONTEXTO DA EXECUÇÃO
========================================================= */

async function getExecutionContext(
  supabase: ReturnType<typeof createClient>,
  executionId: string,
) {

  const {
    data: execution,
    error: executionError,
  } =
    await supabase
      .from(
        "evento_execucoes",
      )
      .select(`
        id,
        evento_id,
        data_real,
        status
      `)
      .eq(
        "id",
        executionId,
      )
      .single();


  if (
    executionError ||
    !execution
  ) {
    throw new HttpError(
      404,
      "Execução não encontrada.",
    );
  }


  const {
    data: event,
    error: eventError,
  } =
    await supabase
      .from(
        "oficinas",
      )
      .select(`
        id,
        regional_id,
        escola_id,
        atividade
      `)
      .eq(
        "id",
        execution.evento_id,
      )
      .single();


  if (
    eventError ||
    !event
  ) {
    throw new HttpError(
      404,
      "Evento relacionado à execução não encontrado.",
    );
  }


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
          nome
        `)
        .eq(
          "id",
          event.regional_id,
        )
        .single(),

      supabase
        .from(
          "escolas",
        )
        .select(`
          id,
          nome
        `)
        .eq(
          "id",
          event.escola_id,
        )
        .single(),
    ]);


  if (
    regionalResult.error ||
    !regionalResult.data
  ) {
    throw new HttpError(
      404,
      "Regional da execução não encontrada.",
    );
  }


  if (
    schoolResult.error ||
    !schoolResult.data
  ) {
    throw new HttpError(
      404,
      "Escola da execução não encontrada.",
    );
  }


  return {
    execution,

    event,

    regional:
      regionalResult.data,

    school:
      schoolResult.data,
  };
}


/* =========================================================
   HIERARQUIA DO DRIVE

   PASTA PRINCIPAL
   └── ANO
       └── REGIONAL
           └── MÊS
               └── DATA + ESCOLA
========================================================= */

async function ensureExecutionFolder(
  accessToken: string,
  context: Awaited<
    ReturnType<typeof getExecutionContext>
  >,
) {

  const rootFolderId =
    requireEnv(
      "GOOGLE_DRIVE_ROOT_FOLDER_ID",
    );


  const [
    year,
    month,
  ] =
    context.execution
      .data_real
      .split(
        "-",
      );


  const monthNumber =
    Number(
      month,
    );


  if (
    !year ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new HttpError(
      500,
      "A data da execução é inválida.",
    );
  }


  const yearFolderName =
    year;


  const regionalFolderName =
    sanitizeDriveName(
      context.regional.nome,
    );


  const monthFolderName =
    `${month} - ${MONTH_NAMES[monthNumber]}`;


  const eventFolderName =
    sanitizeDriveName(
      `${context.execution.data_real} - ${context.school.nome}`,
    );


  const yearFolderId =
    await ensureFolder(
      accessToken,
      rootFolderId,
      yearFolderName,
    );


  const regionalFolderId =
    await ensureFolder(
      accessToken,
      yearFolderId,
      regionalFolderName,
    );


  const monthFolderId =
    await ensureFolder(
      accessToken,
      regionalFolderId,
      monthFolderName,
    );


  const eventFolderId =
    await ensureFolder(
      accessToken,
      monthFolderId,
      eventFolderName,
    );


  return {
    folderId:
      eventFolderId,

    folderPath:
      [
        yearFolderName,
        regionalFolderName,
        monthFolderName,
        eventFolderName,
      ].join(
        " / ",
      ),
  };
}


/* =========================================================
   VALIDAR CONTEÚDO DA IMAGEM
========================================================= */

function isValidImageSignature(
  bytes: Uint8Array,
  mimeType: string,
) {

  if (
    mimeType ===
    "image/jpeg"
  ) {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }


  if (
    mimeType ===
    "image/png"
  ) {

    const signature = [
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
    ];


    return (
      bytes.length >= 8 &&
      signature.every(
        (
          value,
          index,
        ) =>
          bytes[index] ===
          value,
      )
    );
  }


  if (
    mimeType ===
    "image/webp"
  ) {
    return (
      bytes.length >= 12 &&

      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&

      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }


  return false;
}


/* =========================================================
   EXTENSÃO
========================================================= */

function getExtension(
  mimeType: string,
) {

  if (
    mimeType ===
    "image/png"
  ) {
    return "png";
  }


  if (
    mimeType ===
    "image/webp"
  ) {
    return "webp";
  }


  return "jpg";
}


/* =========================================================
   UPLOAD PARA GOOGLE DRIVE
========================================================= */

async function uploadDriveFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
) {

  const boundary =
    `yxz_${crypto.randomUUID()}`;


  const encoder =
    new TextEncoder();


  const metadata =
    JSON.stringify({
      name:
        fileName,

      parents: [
        folderId,
      ],
    });


  const headerBytes =
    encoder.encode(
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`,
    );


  const footerBytes =
    encoder.encode(
      `\r\n--${boundary}--`,
    );


  const body =
    new Uint8Array(
      headerBytes.length +
      bytes.length +
      footerBytes.length,
    );


  body.set(
    headerBytes,
    0,
  );


  body.set(
    bytes,
    headerBytes.length,
  );


  body.set(
    footerBytes,
    headerBytes.length +
      bytes.length,
  );


  const url =
    new URL(
      "https://www.googleapis.com/upload/drive/v3/files",
    );


  url.searchParams.set(
    "uploadType",
    "multipart",
  );


  url.searchParams.set(
    "supportsAllDrives",
    "true",
  );


  url.searchParams.set(
    "fields",
    "id,name,mimeType,size",
  );


  const response =
    await fetch(
      url,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            `multipart/related; boundary=${boundary}`,
        },

        body,
      },
    );


  if (!response.ok) {

    console.error(
      "[YXZ] Falha no upload para Drive:",
      await response.text(),
    );


    throw new HttpError(
      502,
      "Não foi possível enviar a fotografia ao Google Drive.",
    );
  }


  return await response.json();
}


/* =========================================================
   MOVER FOTO
========================================================= */

async function moveDriveFile(
  accessToken: string,
  fileId: string,
  oldParentId: string,
  newParentId: string,
) {

  if (
    oldParentId ===
    newParentId
  ) {
    return;
  }


  const url =
    new URL(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId,
      )}`,
    );


  url.searchParams.set(
    "addParents",
    newParentId,
  );


  url.searchParams.set(
    "removeParents",
    oldParentId,
  );


  url.searchParams.set(
    "supportsAllDrives",
    "true",
  );


  url.searchParams.set(
    "fields",
    "id,parents",
  );


  const response =
    await fetch(
      url,
      {
        method:
          "PATCH",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({}),
      },
    );


  if (!response.ok) {

    console.error(
      "[YXZ] Falha ao mover foto:",
      await response.text(),
    );


    throw new HttpError(
      502,
      "Não foi possível reorganizar uma fotografia no Google Drive.",
    );
  }
}


/* =========================================================
   EXCLUIR FOTO
========================================================= */

async function deleteDriveFile(
  accessToken: string,
  fileId: string,
) {

  const url =
    new URL(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId,
      )}`,
    );


  url.searchParams.set(
    "supportsAllDrives",
    "true",
  );


  const response =
    await fetch(
      url,
      {
        method:
          "DELETE",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    );


  if (
    response.status ===
    404
  ) {
    return;
  }


  if (!response.ok) {

    console.error(
      "[YXZ] Falha ao remover foto:",
      await response.text(),
    );


    throw new HttpError(
      502,
      "Não foi possível remover a fotografia do Google Drive.",
    );
  }
}


/* =========================================================
   DOWNLOAD
========================================================= */

async function downloadDriveFile(
  accessToken: string,
  fileId: string,
) {

  const url =
    new URL(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId,
      )}`,
    );


  url.searchParams.set(
    "alt",
    "media",
  );


  url.searchParams.set(
    "supportsAllDrives",
    "true",
  );


  return await fetch(
    url,
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    },
  );
}


/* =========================================================
   PRÓXIMA POSIÇÃO
========================================================= */

async function getNextPhotoOrder(
  supabase: ReturnType<typeof createClient>,
  executionId: string,
) {

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "execucao_fotos",
      )
      .select(
        "ordem",
      )
      .eq(
        "execucao_id",
        executionId,
      )
      .order(
        "ordem",
      );


  if (error) {
    throw error;
  }


  const used =
    new Set(
      (
        data ||
        []
      ).map(
        (item) =>
          Number(
            item.ordem,
          ),
      ),
    );


  for (
    let order = 1;
    order <= 6;
    order += 1
  ) {

    if (
      !used.has(
        order,
      )
    ) {
      return order;
    }
  }


  throw new HttpError(
    409,
    "Esta execução já possui o limite de 6 fotografias.",
  );
}


/* =========================================================
   UPLOAD
========================================================= */

async function handleUpload(
  request: Request,
  supabase: ReturnType<typeof createClient>,
) {

  const formData =
    await request.formData();


  const executionId =
    String(
      formData.get(
        "execucao_id",
      ) ||
      "",
    ).trim();


  const caption =
    String(
      formData.get(
        "legenda",
      ) ||
      "",
    ).trim();


  const originalName =
    String(
      formData.get(
        "nome_original",
      ) ||
      "",
    ).trim();


  const file =
    formData.get(
      "file",
    );


  if (!executionId) {
    throw new HttpError(
      400,
      "Informe a execução.",
    );
  }


  if (
    caption.length >
    300
  ) {
    throw new HttpError(
      400,
      "A legenda pode possuir no máximo 300 caracteres.",
    );
  }


  if (
    !(file instanceof File)
  ) {
    throw new HttpError(
      400,
      "Nenhuma fotografia foi enviada.",
    );
  }


  if (
    !ALLOWED_MIME_TYPES.has(
      file.type,
    )
  ) {
    throw new HttpError(
      400,
      "Formato não permitido. Utilize JPEG, PNG ou WebP.",
    );
  }


  if (
    file.size <= 0
  ) {
    throw new HttpError(
      400,
      "O arquivo está vazio.",
    );
  }


  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    throw new HttpError(
      413,
      "A fotografia ultrapassa o limite de 5 MB.",
    );
  }


  const bytes =
    new Uint8Array(
      await file.arrayBuffer(),
    );


  if (
    !isValidImageSignature(
      bytes,
      file.type,
    )
  ) {
    throw new HttpError(
      400,
      "O conteúdo enviado não corresponde a uma imagem válida.",
    );
  }


  const context =
    await getExecutionContext(
      supabase,
      executionId,
    );


  const order =
    await getNextPhotoOrder(
      supabase,
      executionId,
    );


  const accessToken =
    await getGoogleAccessToken();


  const {
    folderId,
    folderPath,
  } =
    await ensureExecutionFolder(
      accessToken,
      context,
    );


  const photoId =
    crypto.randomUUID();


  const fileName =
    `${String(order).padStart(2, "0")} - ${photoId.slice(0, 8)}.${getExtension(file.type)}`;


  let driveFile:
    | {
        id: string;
        name: string;
      }
    | null =
      null;


  try {

    driveFile =
      await uploadDriveFile(
        accessToken,
        folderId,
        fileName,
        file.type,
        bytes,
      );


    const {
      data,
      error,
    } =
      await supabase.rpc(
        "register_execution_photo",
        {
          p_id:
            photoId,

          p_execucao_id:
            executionId,

          p_drive_file_id:
            driveFile.id,

          p_drive_folder_id:
            folderId,

          p_nome_original:
            originalName ||
            file.name,

          p_nome_arquivo:
            fileName,

          p_mime_type:
            file.type,

          p_tamanho_bytes:
            file.size,

          p_ordem:
            order,

          p_legenda:
            caption ||
            null,

          p_folder_path:
            folderPath,
        },
      );


    if (error) {
      throw error;
    }


    return jsonResponse(
      {
        success:
          true,

        photo:
          data,

        folderPath,
      },
      201,
    );

  } catch (
    error
  ) {

    if (
      driveFile?.id
    ) {

      try {

        await deleteDriveFile(
          accessToken,
          driveFile.id,
        );

      } catch (
        compensationError
      ) {

        console.error(
          "[YXZ] Falha ao desfazer upload:",
          compensationError,
        );
      }
    }


    throw error;
  }
}


/* =========================================================
   SINCRONIZAR PASTAS
========================================================= */

async function handleSyncFolder(
  supabase: ReturnType<typeof createClient>,
  executionId: string,
) {

  if (!executionId) {
    throw new HttpError(
      400,
      "Informe a execução.",
    );
  }


  const context =
    await getExecutionContext(
      supabase,
      executionId,
    );


  const accessToken =
    await getGoogleAccessToken();


  const {
    folderId,
    folderPath,
  } =
    await ensureExecutionFolder(
      accessToken,
      context,
    );


  const {
    data: photos,
    error,
  } =
    await supabase
      .from(
        "execucao_fotos",
      )
      .select(`
        id,
        drive_file_id,
        drive_folder_id
      `)
      .eq(
        "execucao_id",
        executionId,
      );


  if (error) {
    throw error;
  }


  let moved =
    0;


  for (
    const photo
    of photos ||
    []
  ) {

    if (
      photo.drive_folder_id !==
      folderId
    ) {

      await moveDriveFile(
        accessToken,
        photo.drive_file_id,
        photo.drive_folder_id,
        folderId,
      );


      moved +=
        1;
    }


    const {
      error: metadataError,
    } =
      await supabase.rpc(
        "update_execution_photo_folder_metadata",
        {
          p_foto_id:
            photo.id,

          p_drive_folder_id:
            folderId,

          p_folder_path:
            folderPath,
        },
      );


    if (metadataError) {
      throw metadataError;
    }
  }


  return jsonResponse({
    success:
      true,

    moved,

    folderPath,
  });
}


/* =========================================================
   REMOVER
========================================================= */

async function handleDelete(
  request: Request,
  supabase: ReturnType<typeof createClient>,
) {

  let body;


  try {

    body =
      await request.json();

  } catch {

    throw new HttpError(
      400,
      "Requisição inválida.",
    );
  }


  const photoId =
    String(
      body?.foto_id ||
      "",
    ).trim();


  if (!photoId) {
    throw new HttpError(
      400,
      "Informe a fotografia.",
    );
  }


  const {
    data: photo,
    error,
  } =
    await supabase
      .from(
        "execucao_fotos",
      )
      .select(`
        id,
        execucao_id,
        drive_file_id
      `)
      .eq(
        "id",
        photoId,
      )
      .single();


  if (
    error ||
    !photo
  ) {
    throw new HttpError(
      404,
      "Fotografia não encontrada.",
    );
  }


  const {
    data: execution,
    error: executionError,
  } =
    await supabase
      .from(
        "evento_execucoes",
      )
      .select(`
        id,
        status
      `)
      .eq(
        "id",
        photo.execucao_id,
      )
      .single();


  if (
    executionError ||
    !execution
  ) {
    throw new HttpError(
      404,
      "Execução não encontrada.",
    );
  }


  const {
    count,
    error: countError,
  } =
    await supabase
      .from(
        "execucao_fotos",
      )
      .select(
        "id",
        {
          count:
            "exact",

          head:
            true,
        },
      )
      .eq(
        "execucao_id",
        photo.execucao_id,
      );


  if (countError) {
    throw countError;
  }


  if (
    execution.status ===
      "finalizada"

    &&
    (
      count ||
      0
    ) <= 1
  ) {
    throw new HttpError(
      409,
      "Uma execução finalizada precisa manter pelo menos uma foto de evidência.",
    );
  }


  const accessToken =
    await getGoogleAccessToken();


  await deleteDriveFile(
    accessToken,
    photo.drive_file_id,
  );


  const {
    error: removeError,
  } =
    await supabase.rpc(
      "remove_execution_photo_record",
      {
        p_foto_id:
          photo.id,
      },
    );


  if (removeError) {
    throw removeError;
  }


  return jsonResponse({
    success:
      true,
  });
}


/* =========================================================
   DOWNLOAD PRIVADO
========================================================= */

async function handleDownload(
  supabase: ReturnType<typeof createClient>,
  photoId: string,
) {

  if (!photoId) {
    throw new HttpError(
      400,
      "Informe a fotografia.",
    );
  }


  const {
    data: photo,
    error,
  } =
    await supabase
      .from(
        "execucao_fotos",
      )
      .select(`
        id,
        drive_file_id,
        nome_arquivo,
        mime_type
      `)
      .eq(
        "id",
        photoId,
      )
      .single();


  if (
    error ||
    !photo
  ) {
    throw new HttpError(
      404,
      "Fotografia não encontrada.",
    );
  }


  const accessToken =
    await getGoogleAccessToken();


  const driveResponse =
    await downloadDriveFile(
      accessToken,
      photo.drive_file_id,
    );


  if (!driveResponse.ok) {

    console.error(
      "[YXZ] Drive não retornou imagem:",
      await driveResponse.text(),
    );


    throw new HttpError(
      502,
      "Não foi possível carregar a fotografia.",
    );
  }


  /*
   * application/octet-stream faz o supabase-js
   * interpretar a resposta como Blob.
   */
  return new Response(
    driveResponse.body,
    {
      status:
        200,

      headers: {
        ...corsHeaders,

        "Content-Type":
          "application/octet-stream",

        "X-YXZ-Mime-Type":
          photo.mime_type,

        "Content-Disposition":
          `inline; filename="${photo.nome_arquivo}"`,

        "Cache-Control":
          "private, max-age=300",
      },
    },
  );
}


/* =========================================================
   HEALTH CHECK DO GOOGLE DRIVE
========================================================= */

async function handleHealth() {

  const accessToken =
    await getGoogleAccessToken();


  const rootFolderId =
    requireEnv(
      "GOOGLE_DRIVE_ROOT_FOLDER_ID",
    );


  const url =
    new URL(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        rootFolderId,
      )}`,
    );


  url.searchParams.set(
    "fields",
    "id,name,mimeType,capabilities(canAddChildren)",
  );


  url.searchParams.set(
    "supportsAllDrives",
    "true",
  );


  const response =
    await fetch(
      url,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    );


  if (!response.ok) {

    console.error(
      "[YXZ] Pasta principal inacessível:",
      await response.text(),
    );


    throw new HttpError(
      502,
      "A pasta principal configurada não pôde ser acessada.",
    );
  }


  const folder =
    await response.json();


  if (
    folder.mimeType !==
    DRIVE_FOLDER_MIME
  ) {
    throw new HttpError(
      500,
      "O GOOGLE_DRIVE_ROOT_FOLDER_ID não corresponde a uma pasta.",
    );
  }


  if (
    !folder.capabilities
      ?.canAddChildren
  ) {
    throw new HttpError(
      403,
      "A conta Google autorizada não pode adicionar arquivos à pasta principal.",
    );
  }


  return jsonResponse({
    success:
      true,

    folderName:
      folder.name,

    canAddChildren:
      true,
  });
}


/* =========================================================
   HANDLER
========================================================= */

Deno.serve(
  async (
    request: Request,
  ) => {

    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status:
            204,

          headers:
            corsHeaders,
        },
      );
    }


    try {

      const supabase =
        await createAuthenticatedSupabase(
          request,
        );


      /* =====================================================
         DELETE
      ===================================================== */

      if (
        request.method ===
        "DELETE"
      ) {
        return await handleDelete(
          request,
          supabase,
        );
      }


      /* =====================================================
         UPLOAD - FORMDATA
      ===================================================== */

      if (
        request.method ===
        "POST"
      ) {

        const contentType =
          request.headers.get(
            "Content-Type",
          ) ||
          "";


        if (
          contentType.includes(
            "multipart/form-data",
          )
        ) {
          return await handleUpload(
            request,
            supabase,
          );
        }


        let body;


        try {

          body =
            await request.json();

        } catch {

          throw new HttpError(
            400,
            "Corpo da requisição inválido.",
          );
        }


        /* ===================================================
           HEALTH
        =================================================== */

        if (
          body?.action ===
          "health"
        ) {
          return await handleHealth();
        }


        /* ===================================================
           DOWNLOAD
        =================================================== */

        if (
          body?.action ===
          "download"
        ) {
          return await handleDownload(
            supabase,

            String(
              body.foto_id ||
              "",
            ),
          );
        }


        /* ===================================================
           SINCRONIZAR PASTA
        =================================================== */

        if (
          body?.action ===
          "sync-folder"
        ) {
          return await handleSyncFolder(
            supabase,

            String(
              body.execucao_id ||
              "",
            ),
          );
        }


        throw new HttpError(
          400,
          "Ação inválida.",
        );
      }


      throw new HttpError(
        405,
        "Método não permitido.",
      );

    } catch (
      error
    ) {

      console.error(
        "[YXZ] evidencia-foto:",
        error,
      );


      if (
        error instanceof
        HttpError
      ) {
        return jsonResponse(
          {
            success:
              false,

            error:
              error.message,
          },
          error.status,
        );
      }


      return jsonResponse(
        {
          success:
            false,

          error:
            error instanceof Error
              ? error.message
              : "Erro inesperado.",
        },
        500,
      );
    }
  },
);