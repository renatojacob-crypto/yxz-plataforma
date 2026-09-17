import { supabase } from "./supabase.js";
import { appUrl } from "./paths.js";
import { isAdministrator } from "./auth.js";

const state = {
  avisos: [],
  filtro: "nao_lidas",
  selecionado: null,
  carregando: false,
  detalheSeq: 0,
};

function elem(selector) {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`Falta elemento em pecas-notificacoes.html: ${selector}`);
  return node;
}

function textNode(tag, conteudo, classe = "") {
  const node = document.createElement(tag);
  node.textContent = String(conteudo ?? "");
  if (classe) node.className = classe;
  return node;
}

function dataBR(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.valueOf())
    ? ""
    : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function mensagem(texto, tipo = "") {
  const node = elem("[data-gpn-mensagem]");
  node.textContent = texto;
  node.dataset.state = tipo;
}

function sinalizarMudanca() {
  window.dispatchEvent(new Event("gp:notificacoes-atualizadas"));
}

function montarLinkPedido(pedidoId) {
  // Somente para administradores. A propria pagina destino verifica permissao.
  if (!isAdministrator()) return null;
  const url = new URL(appUrl("pecas-pedidos.html"), window.location.origin);
  url.searchParams.set("pedido", pedidoId);
  return url.pathname + url.search;
}

function renderizarLista() {
  const lista = elem("[data-gpn-lista]");
  lista.replaceChildren();

  const exibidos = state.avisos.filter((n) =>
    state.filtro === "todos" || !n.lida,
  );
  const naoLidos = state.avisos.filter((n) => !n.lida).length;

  elem("[data-gpn-total]").textContent =
    `${naoLidos} não lido(s) · ${exibidos.length} exibido(s)`;

  if (!exibidos.length) {
    lista.append(textNode(
      "p",
      state.filtro === "nao_lidas"
        ? "Nenhum aviso pendente. Selecione Todos para ver o histórico."
        : "Nenhum aviso encontrado. Novos pedidos e envios gerarão avisos.",
      "gp-n-nenhum",
    ));
    return;
  }

  for (const aviso of exibidos) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gp-n-item";
    button.dataset.lida = String(aviso.lida);
    button.setAttribute("aria-pressed", String(state.selecionado === aviso.id));
    if (state.selecionado === aviso.id) button.classList.add("gp-n-selecionado");

    const cab = document.createElement("span");
    cab.className = "gp-n-item-cab";
    cab.append(
      textNode("strong", aviso.titulo),
      textNode("small", dataBR(aviso.criado_em)),
    );
    button.append(cab, textNode("span", aviso.mensagem, "gp-n-item-mensagem"));
    if (!aviso.lida) button.append(textNode("span", "● Não lido", "gp-n-nao-lido"));
    button.addEventListener("click", () => { void abrirAviso(aviso); });
    lista.append(button);
  }
}

async function carregarAvisos({ silencioso = false } = {}) {
  if (state.carregando) return;
  state.carregando = true;
  try {
    if (!silencioso) mensagem("Consultando notificações...", "loading");
    const { data, error } = await supabase
      .from("gp_notificacoes")
      .select("id,usuario_id,pedido_id,envio_id,tipo,titulo,mensagem,lida,lida_em,criado_em")
      .order("criado_em", { ascending: false })
      .limit(200);

    if (error) throw error;
    state.avisos = data ?? [];
    renderizarLista();
    if (!silencioso) mensagem("Avisos atualizados.", "success");
    sinalizarMudanca();
  } catch (error) {
    console.error("[YXZ] Não foi possível buscar notificações:", error);
    mensagem(`Não foi possível consultar notificações: ${error.message}`, "error");
  } finally {
    state.carregando = false;
  }
}

async function marcarLida(avisoId) {
  const { data, error } = await supabase.rpc("gp_marcar_notificacao_lida", {
    p_notificacao_id: avisoId,
  });
  if (error) throw error;
  if (data === true) {
    const aviso = state.avisos.find((n) => n.id === avisoId);
    if (aviso) aviso.lida = true;
    renderizarLista();
    sinalizarMudanca();
  }
}

async function montarDetalhePedido(aviso, painel, seq) {
  const { data: pedido, error: errPedido } = await supabase
    .from("gp_pedidos")
    .select("id,numero,responsavel,status,total_itens,total_pecas,observacoes,criado_em")
    .eq("id", aviso.pedido_id)
    .maybeSingle();
  if (errPedido) throw errPedido;
  if (!pedido) throw new Error("Pedido não disponível para sua conta.");

  const { data: itens, error: errItens } = await supabase
    .from("gp_itens_pedido")
    .select("id,peca_id,nome_peca,categoria,cor,quantidade,quantidade_enviada,quantidade_separada")
    .eq("pedido_id", aviso.pedido_id)
    .order("nome_peca");
  if (errItens) throw errItens;

  let itensLote = [];
  if (aviso.envio_id) {
    const res = await supabase
      .from("gp_envio_itens")
      .select("item_id,quantidade")
      .eq("envio_id", aviso.envio_id);
    if (res.error) throw res.error;
    itensLote = res.data ?? [];
  }
  if (seq !== state.detalheSeq) return;
  painel.replaceChildren();

  painel.append(
    textNode("h3", pedido.numero),
    textNode("p", `Status atual: ${pedido.status}`, "gp-n-dado"),
    textNode("p", `Solicitante: ${pedido.responsavel} · ${dataBR(pedido.criado_em)}`, "gp-n-dado"),
    textNode("p", `Total solicitado: ${pedido.total_pecas} unidade(s)`, "gp-n-dado"),
  );

  if (aviso.envio_id) {
    const total = itensLote.reduce((s, i) => s + i.quantidade, 0);
    painel.append(textNode("p", `Neste envio: ${total} unidade(s)`, "gp-n-lote"));
  }
  if (pedido.observacoes) painel.append(textNode("p", `Observações: ${pedido.observacoes}`));

  const lotePorItem = new Map(itensLote.map((i) => [i.item_id, i.quantidade]));
  const tabela = document.createElement("div");
  tabela.className = "gp-n-itens";
  const imagens = new Map();

  // Apenas consulta, sem alterar estoque. Imagens assinadas expiram em 2 minutos.
  const pecasIds = [...new Set((itens ?? []).map((i) => i.peca_id).filter(Boolean))];
  if (pecasIds.length) {
    const resultado = await supabase
      .from("gp_pecas")
      .select("id,imagem_path")
      .in("id", pecasIds);
    if (!resultado.error) {
      for (const peca of resultado.data ?? []) {
        if (peca.imagem_path) imagens.set(peca.id, peca.imagem_path);
      }
    }
  }
  if (seq !== state.detalheSeq) return;

  // Uma chamada de URLs assinadas para todo o pedido, não uma por peça.
  const paths = [...new Set(imagens.values())];
  const urls = new Map();
  if (paths.length) {
    const assinaturas = await supabase.storage
      .from("gp-pecas")
      .createSignedUrls(paths, 120);
    if (!assinaturas.error) {
      paths.forEach((path, index) => {
        const url = assinaturas.data?.[index]?.signedUrl;
        if (url) urls.set(path, url);
      });
    }
  }
  if (seq !== state.detalheSeq) return;

  for (const item of itens ?? []) {
    const linha = document.createElement("div");
    linha.className = "gp-n-peca";
    const path = imagens.get(item.peca_id);
    const url = path ? urls.get(path) : null;
    const imagem = url ? document.createElement("img")
      : textNode("span", "Sem foto", "gp-n-foto gp-n-sem-foto");
    if (url) {
      imagem.alt = `Fotografia da peça ${item.nome_peca}`;
      imagem.loading = "lazy";
      imagem.src = url;
    }

    const info = document.createElement("div");
    info.append(
      textNode("strong", item.nome_peca),
      textNode("small", `${item.categoria || "Sem categoria"} · ${item.cor || "Sem cor"}`),
      textNode("small", `Solicitado: ${item.quantidade} · Enviado acumulado: ${item.quantidade_enviada ?? 0}`),
      textNode("small", `Pendente: ${Math.max(0, item.quantidade - (item.quantidade_enviada ?? 0))}`),
    );
    if (aviso.envio_id) {
      info.append(textNode("small", `Neste lote: ${lotePorItem.get(item.id) ?? 0}`, "gp-n-lote"));
    }
    linha.append(imagem, info);
    tabela.append(linha);
  }
  painel.append(tabela);

  const destino = montarLinkPedido(pedido.id);
  if (destino) {
    const link = document.createElement("a");
    link.href = destino;
    link.className = "btn btn-primary gp-n-link";
    link.textContent = "Abrir na gestão e separação";
    painel.append(link);
  } else {
    painel.append(textNode(
      "p",
      "Detalhes disponíveis aqui para o solicitante. A edição e a expedição são exclusivas da gestão.",
      "gp-n-dado",
    ));
  }
}

async function abrirAviso(aviso) {
  state.selecionado = aviso.id;
  const seq = ++state.detalheSeq;
  const painel = elem("[data-gpn-detalhe]");
  painel.replaceChildren(textNode("p", "Carregando detalhes...", "gp-n-nenhum"));
  renderizarLista();

  try {
    if (!aviso.lida) await marcarLida(aviso.id);
    await montarDetalhePedido(aviso, painel, seq);
    mensagem("", "");
  } catch (error) {
    if (seq !== state.detalheSeq) return;
    console.error("[YXZ] Falha ao abrir aviso:", error);
    painel.replaceChildren(textNode("p", `Não foi possível abrir o aviso: ${error.message}`, "gp-n-erro"));
  }
}

async function marcarTodas() {
  const button = elem("[data-gpn-marcar-todas]");
  button.disabled = true;
  try {
    const { error } = await supabase.rpc("gp_marcar_todas_notificacoes_lidas");
    if (error) throw error;
    await carregarAvisos();
    mensagem("Todos os seus avisos foram marcados como lidos.", "success");
  } catch (error) {
    mensagem(`Não foi possível marcar os avisos: ${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
}

export async function initPecasNotificacoesPage() {
  elem("[data-gpn-filtro]").addEventListener("change", (evento) => {
    state.filtro = evento.target.value;
    renderizarLista();
  });
  elem("[data-gpn-atualizar]").addEventListener("click", () => {
    void carregarAvisos();
  });
  elem("[data-gpn-marcar-todas]").addEventListener("click", () => {
    void marcarTodas();
  });

  await carregarAvisos();

  // Atualizacao moderada enquanto a aba esta aberta: nao exige Realtime.
  const intervalo = window.setInterval(() => {
    if (!document.hidden) void carregarAvisos({ silencioso: true });
  }, 60000);
  window.addEventListener("pagehide", () => window.clearInterval(intervalo), { once: true });
}
