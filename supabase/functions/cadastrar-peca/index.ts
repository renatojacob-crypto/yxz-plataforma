/**
 * Portal YXZ 2.0 | Cadastro de peça com imagem no Storage privado.
 * A autorização é validada aqui e novamente na RPC PostgreSQL.
 * Não expor service role ou segredo ao frontend.
 */
import { withSupabase } from "npm:@supabase/server@^1";

const BUCKET = "gp-pecas";
const MAX_IMAGEM = 5 * 1024 * 1024;

function erro(message: string, status = 400, code = "invalid_request") {
  return Response.json({ ok: false, code, message }, { status });
}

function campo(form: FormData, chave: string, limite: number) {
  const value = form.get(chave);
  return typeof value === "string" ? value.trim().slice(0, limite + 1) : "";
}

function inteiro(value: string): number | null {
  if (!/^\d{1,7}$/.test(value)) return null;
  const numero = Number(value);
  return Number.isSafeInteger(numero) && numero <= 1_000_000 ? numero : null;
}

async function detectarImagem(arquivo: File) {
  const bytes = new Uint8Array(await arquivo.slice(0, 16).arrayBuffer());
  if (bytes.length < 12) return null;
  // Verifica o conteúdo, não apenas extensão/MIME declarados no navegador.
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", mime: "image/jpeg" };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
      bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a &&
      bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return { extension: "png", mime: "image/png" };
  }
  const asAscii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  if (asAscii(0, 4) === "RIFF" && asAscii(8, 12) === "WEBP") {
    return { extension: "webp", mime: "image/webp" };
  }
  return null;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return erro("Método não permitido.", 405, "method");

    const idUsuario = ctx.userClaims?.id;
    if (!idUsuario) return erro("Faça login novamente.", 401, "unauthenticated");

    // Consultar o perfil NO BANCO. Nunca aceitar perfil informado no payload.
    const { data: perfil, error: perfilErro } = await ctx.supabaseAdmin
      .from("profiles")
      .select("perfil,ativo")
      .eq("id", idUsuario)
      .maybeSingle();

    if (perfilErro) {
      console.error("[YXZ] Não foi possível validar o gestor:", perfilErro.code);
      return erro("Não foi possível verificar a permissão.", 500, "profile_error");
    }
    if (!perfil?.ativo ||
        !["administrador", "administrador_master"].includes(perfil.perfil)) {
      return erro("Você não tem permissão para cadastrar peças.", 403, "forbidden");
    }

    if (!(req.headers.get("content-type") || "").toLowerCase().includes("multipart/form-data")) {
      return erro("Envie o formulário com uma fotografia.", 415, "content_type");
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return erro("Não foi possível ler o formulário.", 400, "form_data");
    }

    const codigo = campo(form, "codigo", 60).toUpperCase();
    const nome = campo(form, "nome", 180);
    const categoria = campo(form, "categoria", 100);
    const cor = campo(form, "cor", 80);
    const estoque = inteiro(campo(form, "estoque", 12));
    const estoqueMinimo = inteiro(campo(form, "estoque_minimo", 12));
    const todas = campo(form, "disponivel_todas", 5) === "true";
    const oficinasRaw = campo(form, "oficinas", 4000);
    const arquivo = form.get("imagem");

    if (!/^[A-Z0-9][A-Z0-9._/-]{1,59}$/.test(codigo)) {
      return erro("Código inválido: use de 2 a 60 caracteres, letras, números, ponto, barra, hífen ou sublinhado.");
    }
    if (nome.length < 2 || nome.length > 180 ||
        categoria.length > 100 || cor.length > 80 ||
        estoque === null || estoqueMinimo === null) {
      return erro("Revise o nome, a categoria, a cor e as quantidades.");
    }
    if (!(arquivo instanceof File) || arquivo.size === 0 || arquivo.size > MAX_IMAGEM) {
      return erro("Selecione uma imagem JPG, PNG ou WebP de até 5 MB.");
    }

    let oficinas: string[];
    try {
      const list = JSON.parse(oficinasRaw);
      if (!Array.isArray(list) ||
          list.length > 100 ||
          list.some((id) => typeof id !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        return erro("Lista de oficinas inválida.");
      }
      oficinas = list;
    } catch {
      return erro("Lista de oficinas inválida.");
    }
    if ((!todas && oficinas.length === 0) || (todas && oficinas.length !== 0)) {
      return erro("Escolha todas as oficinas ou selecione oficinas específicas.");
    }

    const tipo = await detectarImagem(arquivo);
    if (!tipo) return erro("Arquivo não corresponde a uma imagem JPG, PNG ou WebP válida.");
    const imagemPath = `pecas/cadastros/${crypto.randomUUID()}.${tipo.extension}`;
    const { error: uploadErro } = await ctx.supabaseAdmin.storage
      .from(BUCKET)
      .upload(imagemPath, arquivo, {
        contentType: tipo.mime,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadErro) {
      console.error("[YXZ] Upload de foto falhou:", uploadErro.message);
      return erro("Não foi possível salvar a fotografia. Tente novamente.", 500, "upload_failed");
    }

    // A RPC é chamada com o JWT do usuário: auth.uid() é o autor real.
    // Cadastro, vínculos e movimento inicial ocorrem em uma transação no Postgres.
    let criado = null;
    let falha = null;
    try {
      const resultado = await ctx.supabase.rpc("gp_cadastrar_peca", {
        p_codigo: codigo,
        p_nome: nome,
        p_categoria: categoria,
        p_cor: cor,
        p_estoque: estoque,
        p_estoque_minimo: estoqueMinimo,
        p_disponivel_todas: todas,
        p_oficinas: oficinas,
        p_imagem_path: imagemPath,
      });
      criado = resultado.data;
      falha = resultado.error;
    } catch (exception) {
      falha = exception;
    }

    if (falha || !criado?.id) {
      // Compensação: impede foto órfã quando a transação do banco falha.
      const { error: limpezaErro } = await ctx.supabaseAdmin.storage
        .from(BUCKET).remove([imagemPath]);
      if (limpezaErro) {
        console.error("[YXZ] Atenção: foto órfã requer limpeza:", imagemPath, limpezaErro.message);
      }
      const duplicado = falha?.code === "23505";
      console.error("[YXZ] Cadastro da peça não concluído:", falha?.code || "missing_result");
      return erro(
        duplicado
          ? "Este código já está cadastrado."
          : "Não foi possível concluir o cadastro. Nenhuma peça foi registrada; verifique antes de tentar novamente.",
        duplicado ? 409 : 500,
        duplicado ? "duplicate_code" : "create_failed",
      );
    }

    return Response.json({
      ok: true,
      message: "Peça cadastrada com sucesso.",
      peca: criado,
    }, { status: 201 });
  }),
};
