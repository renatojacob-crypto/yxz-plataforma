/**
 * Portal YXZ 2.0 | Cadastro de peças.
 * O frontend não possui chave administrativa.
 * A Edge Function autentica o gestor e a RPC valida a permissão outra vez.
 */
import { supabase } from "./supabase.js";
import { appUrl } from "./paths.js";

const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

function elemento(seletor) {
  const el = document.querySelector(seletor);
  if (!el) throw new Error(`Campo ausente do formulário: ${seletor}`);
  return el;
}

function avisar(ui, texto, estado = "") {
  ui.status.textContent = texto;
  ui.status.dataset.state = estado;
}

function numeroInteiro(input, rotulo) {
  const texto = input.value.trim();
  const valor = Number(texto);
  if (!/^\d{1,7}$/.test(texto) || !Number.isSafeInteger(valor) || valor > 1_000_000) {
    throw new Error(`${rotulo}: informe um inteiro de 0 até 1.000.000.`);
  }
  return valor;
}

function listaOficinas(ui) {
  return [...ui.oficinas.querySelectorAll('input[type="checkbox"]:checked')]
    .map((item) => item.value);
}

function atualizarOficinas(ui) {
  const especificas = ui.form.elements.disponibilidade.value === "especificas";
  ui.oficinas.hidden = !especificas;
  ui.oficinas.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.disabled = !especificas || ui.salvar.disabled;
  });
}

async function carregarOficinas(ui) {
  const { data, error } = await supabase
    .from("gp_oficinas")
    .select("id,nome")
    .eq("ativo", true)
    .order("nome");
  if (error) throw new Error(`Não foi possível carregar as oficinas: ${error.message}`);
  if (!data?.length) throw new Error("Nenhuma oficina ativa foi encontrada.");

  ui.oficinas.replaceChildren();
  for (const oficina of data) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = oficina.id;
    label.append(input, document.createTextNode(oficina.nome));
    ui.oficinas.append(label);
  }
  ui.salvar.disabled = false;
  atualizarOficinas(ui);
  avisar(ui, "Formulário pronto para cadastrar a peça.", "success");
}

function liberarFormulario(ui, liberado) {
  ui.salvar.disabled = !liberado;
  ui.form.querySelectorAll("input,button").forEach((node) => {
    // Manter os campos desabilitados enquanto a requisição estiver em andamento.
    node.disabled = !liberado;
  });
  if (liberado) atualizarOficinas(ui);
}

function configurarPreview(ui) {
  let urlPreview = null;

  function limparPreview() {
    if (urlPreview) URL.revokeObjectURL(urlPreview);
    urlPreview = null;
    ui.preview.textContent = "Prévia da fotografia";
  }

  ui.imagem.addEventListener("change", () => {
    limparPreview();
    const arquivo = ui.imagem.files?.[0];
    if (!arquivo) return;
    if (!TIPOS_PERMITIDOS.has(arquivo.type) || arquivo.size < 1 ||
      arquivo.size > TAMANHO_MAXIMO) {
      ui.imagem.value = "";
      avisar(ui, "Selecione JPG, PNG ou WebP de até 5 MB.", "error");
      return;
    }
    urlPreview = URL.createObjectURL(arquivo);
    const img = document.createElement("img");
    img.alt = "Prévia da fotografia selecionada";
    img.src = urlPreview;
    ui.preview.replaceChildren(img);
  });

  ui.form.addEventListener("reset", () => {
    // O evento reset ocorre antes de os valores padrão serem restaurados.
    setTimeout(() => {
      limparPreview();
      ui.result.replaceChildren();
      atualizarOficinas(ui);
    }, 0);
  });
}

async function enviarCadastro(evento, ui) {
  evento.preventDefault();
  if (ui.salvar.disabled) return;

  try {
    if (!ui.form.reportValidity()) return;
    const arquivo = ui.imagem.files?.[0];
    if (!arquivo || !TIPOS_PERMITIDOS.has(arquivo.type) ||
        arquivo.size < 1 || arquivo.size > TAMANHO_MAXIMO) {
      throw new Error("Selecione uma fotografia JPG, PNG ou WebP de até 5 MB.");
    }

    const codigo = ui.form.elements.codigo.value.trim().toUpperCase();
    const nome = ui.form.elements.nome.value.trim();
    const categoria = ui.form.elements.categoria.value.trim();
    const cor = ui.form.elements.cor.value.trim();
    const estoque = numeroInteiro(ui.form.elements.estoque, "Estoque inicial");
    const estoqueMinimo = numeroInteiro(ui.form.elements.estoque_minimo, "Estoque mínimo");
    const todas = ui.form.elements.disponibilidade.value === "todas";
    const oficinas = todas ? [] : listaOficinas(ui);
    if (!todas && !oficinas.length) throw new Error("Selecione pelo menos uma oficina.");

    const body = new FormData();
    body.append("codigo", codigo);
    body.append("nome", nome);
    body.append("categoria", categoria);
    body.append("cor", cor);
    body.append("estoque", String(estoque));
    body.append("estoque_minimo", String(estoqueMinimo));
    body.append("disponivel_todas", String(todas));
    body.append("oficinas", JSON.stringify(oficinas));
    body.append("imagem", arquivo, arquivo.name);

    liberarFormulario(ui, false);
    avisar(ui, "Enviando fotografia e cadastrando peça. Aguarde...", "loading");
    ui.result.replaceChildren();

    const { data, error } = await supabase.functions.invoke("cadastrar-peca", { body });
    if (error) {
      let detalhe = null;
      if (typeof error.context?.json === "function") {
        try { detalhe = await error.context.json(); } catch { /* resposta não JSON */ }
      }
      throw new Error(detalhe?.message || "Falha no cadastro. Confira a função cadastrar-peca.");
    }
    if (!data?.ok || !data?.peca?.id) {
      throw new Error(data?.message || "O cadastro não foi confirmado pelo Supabase.");
    }

    ui.form.reset();
    avisar(ui, `Peça ${data.peca.codigo} cadastrada com sucesso.`, "success");

    const link = document.createElement("a");
    link.href = appUrl("pecas.html");
    link.className = "btn btn-ghost";
    link.textContent = "Abrir catálogo atualizado";
    ui.result.append(link);
  } catch (erro) {
    console.error("[YXZ] Falha ao cadastrar peça:", erro);
    avisar(ui, erro.message || "Não foi possível cadastrar a peça.", "error");
  } finally {
    liberarFormulario(ui, true);
  }
}

export async function initPecasCadastroPage() {
  const ui = {
    form: elemento("[data-gpc-form]"),
    oficinas: elemento("[data-gpc-oficinas]"),
    imagem: elemento("#gpcImagem"),
    preview: elemento("[data-gpc-preview]"),
    salvar: elemento("[data-gpc-salvar]"),
    status: elemento("[data-gpc-status]"),
    result: elemento("[data-gpc-result]"),
  };

  ui.form.querySelectorAll('input[name="disponibilidade"]').forEach((radio) => {
    radio.addEventListener("change", () => atualizarOficinas(ui));
  });
  configurarPreview(ui);
  ui.form.addEventListener("submit", (evento) => enviarCadastro(evento, ui));
  try {
    await carregarOficinas(ui);
  } catch (erro) {
    console.error("[YXZ] Erro no formulário de peças:", erro);
    avisar(ui, erro.message, "error");
  }
}
