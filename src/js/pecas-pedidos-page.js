/**
 * YXZ Portal 2.0 | Etapa 4
 * Gestão, separação e expedição. O estoque é baixado apenas pelo RPC no envio.
 * A autorização efetiva acontece no RPC PostgreSQL e nas políticas RLS.
 */
import { supabase } from "./supabase.js";

const STATUS_EDITAVEIS = new Set(["Solicitado", "Em separação", "Parcialmente enviado"]);
const state = {
  pedidos: [],
  oficinas: new Map(),
  regionais: new Map(),
  selecionado: null,
  itens: [],
  detalhes: new Map(),
  carregando: false,
  salvando: false,
  enviando: false,
  sequencia: 0,
};

function el(seletor) {
  const node = document.querySelector(seletor);
  if (!node) throw new Error(`Elemento ausente em pecas-pedidos.html: ${seletor}`);
  return node;
}

function refs() {
  return {
    atualizar: el("[data-gpm-atualizar]"),
    mensagem: el("[data-gpm-mensagem]"),
    busca: el("[data-gpm-busca]"),
    status: el("[data-gpm-status]"),
    oficina: el("[data-gpm-oficina]"),
    regional: el("[data-gpm-regional]"),
    contagem: el("[data-gpm-contagem]"),
    lista: el("[data-gpm-lista]"),
    detalhe: el("[data-gpm-detalhe]"),
  };
}

function texto(parent, tag, content, classe = "") {
  const node = document.createElement(tag);
  node.textContent = String(content ?? "");
  if (classe) node.className = classe;
  parent.append(node);
  return node;
}

function mensagem(ui, content, tipo = "") {
  ui.mensagem.textContent = content;
  ui.mensagem.dataset.state = tipo;
}

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleString("pt-BR") : "—";
}

function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function preencherFiltro(select, dados) {
  const atual = select.value;
  for (const item of dados) {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.nome;
    select.append(opt);
  }
  if (dados.some((item) => item.id === atual)) select.value = atual;
}

async function carregarReferencias(ui) {
  const [oficinas, regionais] = await Promise.all([
    supabase.from("gp_oficinas").select("id,nome").order("nome"),
    supabase.from("gp_regionais").select("id,nome").order("nome"),
  ]);
  if (oficinas.error) throw oficinas.error;
  if (regionais.error) throw regionais.error;
  state.oficinas = new Map((oficinas.data || []).map((o) => [o.id, o.nome]));
  state.regionais = new Map((regionais.data || []).map((r) => [r.id, r.nome]));
  preencherFiltro(ui.oficina, oficinas.data || []);
  preencherFiltro(ui.regional, regionais.data || []);
}

function listarFiltrados(ui) {
  const busca = normalizar(ui.busca.value);
  return state.pedidos.filter((p) => (
    (!ui.status.value || ui.status.value === p.status)
    && (!ui.oficina.value || ui.oficina.value === p.oficina_id)
    && (!ui.regional.value || ui.regional.value === p.regional_id)
    && (!busca || normalizar(`${p.numero} ${p.responsavel} ${p.observacoes}`).includes(busca))
  ));
}

function pintarLista(ui) {
  const pedidos = listarFiltrados(ui);
  ui.contagem.textContent = `${pedidos.length} resultado(s)`;
  ui.lista.replaceChildren();

  if (!pedidos.length) {
    texto(ui.lista, "p", "Nenhum pedido encontrado.", "gp-admin-muted");
    return;
  }
  for (const pedido of pedidos) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gp-admin-pedido";
    if (pedido.id === state.selecionado) btn.classList.add("is-selected");
    btn.setAttribute("aria-pressed", String(pedido.id === state.selecionado));

    texto(btn, "strong", pedido.numero);
    texto(btn, "small",
      `${pedido.responsavel} · ${state.oficinas.get(pedido.oficina_id) || "Oficina"} · ${state.regionais.get(pedido.regional_id) || "Regional"}`);
    texto(btn, "small", formatarData(pedido.criado_em));
    const badge = texto(btn, "span", pedido.status, "gp-admin-status");
    badge.dataset.status = pedido.status;
    btn.addEventListener("click", () => abrirPedido(ui, pedido.id));
    ui.lista.append(btn);
  }
}

async function carregarPedidos(ui) {
  if (state.carregando || state.salvando) return;
  state.carregando = true;
  ui.atualizar.disabled = true;
  mensagem(ui, "Consultando pedidos no Supabase...", "loading");
  try {
    const { data, error } = await supabase
      .from("gp_pedidos")
.select("id,numero,responsavel,usuario_id,regional_id,oficina_id,status,observacoes,total_itens,total_pecas,criado_em,atualizado_em,separacao_atualizada_em")
      .order("criado_em", { ascending: false })
      .limit(200);
    if (error) throw error;
    state.pedidos = data || [];
    pintarLista(ui);
    mensagem(ui, `${state.pedidos.length} pedido(s) recente(s) consultado(s).`, "success");
    // Apenas pedido carregado e autorizado pela RLS será selecionado pela URL.
    const pedidoUrl = new URLSearchParams(window.location.search).get("pedido");
    const alvo = state.selecionado || pedidoUrl;
    if (alvo && state.pedidos.some((p) => p.id === alvo)) {
      await abrirPedido(ui, alvo);
    } else if (state.selecionado) {
      state.selecionado = null;
      ui.detalhe.replaceChildren();
      texto(ui.detalhe, "p", "Pedido fora da lista dos 200 mais recentes. Consulte os filtros ou atualize.", "gp-admin-muted");
    }
  } catch (error) {
    console.error("[YXZ] Erro ao consultar pedidos:", error);
    mensagem(ui, `Não foi possível carregar os pedidos: ${error.message}`, "error");
  } finally {
    state.carregando = false;
    ui.atualizar.disabled = false;
  }
}

function criarDado(container, titulo, valor) {
  const item = document.createElement("div");
  texto(item, "strong", titulo);
  texto(item, "span", valor);
  container.append(item);
}

function validarInputs(form, itens) {
  return itens.map((item) => {
    const input = form.querySelector(`[data-gpm-qtd="${item.id}"]`);
    const n = Number(input?.value);
    if (!Number.isInteger(n) || n < 0 || n > item.quantidade - (item.quantidade_enviada ?? 0)) {
      throw new Error(`Quantidade inválida para "${item.nome_peca}". Informe de 0 a ${item.quantidade - (item.quantidade_enviada ?? 0)}.`);
    }
    return { item_id: item.id, quantidade_separada: n };
  });
}

function atualizarResumo(form, itens, resumo, aviso) {
  try {
    const valores = validarInputs(form, itens);
    const solicitado = itens.reduce((soma, i) => soma + i.quantidade, 0);
    const enviado = itens.reduce((soma, i) => soma + (i.quantidade_enviada ?? 0), 0);
    const separado = valores.reduce((soma, i) => soma + i.quantidade_separada, 0);
    resumo.textContent =
      `${solicitado} solicitado(s) · ${enviado} já enviado(s) · ${separado} separado(s) neste lote · ` +
      `${solicitado - enviado - separado} ainda pendente(s)`;
    aviso.textContent = "A separação não reserva estoque. Ao confirmar envio, o sistema revalida o saldo e desconta apenas este lote.";
  } catch (error) {
    resumo.textContent = "Revise as quantidades.";
    aviso.textContent = error.message;
  }
}

async function carregarImagens(itens, mediaPorPeca, ui) {
  const paths = [...new Set(itens.map((item) => state.detalhes.get(item.peca_id)?.imagem_path).filter(Boolean))];
  if (!paths.length) return;

  try {
    // O bucket continua privado: as URLs expiram depois de 5 minutos.
    const { data, error } = await supabase.storage
      .from("gp-pecas")
      .createSignedUrls(paths, 300);
    if (error) throw error;
    paths.forEach((path, i) => {
      const url = data?.[i]?.signedUrl || data?.[i]?.signedURL;
      if (!url) return;
      for (const item of itens) {
        if (state.detalhes.get(item.peca_id)?.imagem_path !== path) continue;
        const container = mediaPorPeca.get(item.id);
        if (!container || !container.isConnected) continue;
        const img = document.createElement("img");
        img.src = url;
        img.alt = `Foto da peça ${item.nome_peca}`;
        img.loading = "lazy";
        img.addEventListener("error", () => {
          img.remove();
          container.textContent = "Foto indisponível";
        }, { once: true });
        container.replaceChildren(img);
      }
    });
  } catch (error) {
    // Falha ao carregar uma imagem NÃO impede consultar ou salvar a separação.
    console.warn("[YXZ] Fotografias do Storage não disponíveis:", error);
    mensagem(ui, "O pedido carregou, mas não foi possível carregar algumas fotografias do Storage.", "error");
  }
}

function renderizarDetalhes(ui, pedido, itens) {
  ui.detalhe.replaceChildren();
  texto(ui.detalhe, "h3", pedido.numero);
  const badge = texto(ui.detalhe, "span", pedido.status, "gp-admin-status");
  badge.dataset.status = pedido.status;

  const dados = document.createElement("div");
  dados.className = "gp-admin-dados";
  criarDado(dados, "Solicitante", pedido.responsavel);
  criarDado(dados, "Oficina", state.oficinas.get(pedido.oficina_id) || "—");
  criarDado(dados, "Regional", state.regionais.get(pedido.regional_id) || "—");
  criarDado(dados, "Solicitado em", formatarData(pedido.criado_em));
  ui.detalhe.append(dados);
  texto(ui.detalhe, "p", `Observações: ${pedido.observacoes || "Nenhuma"}`, "gp-admin-obs");

  const form = document.createElement("form");
  form.noValidate = true;
  const lista = document.createElement("div");
  lista.className = "gp-admin-itens";
  const editavel = STATUS_EDITAVEIS.has(pedido.status);
  const medias = new Map();

  for (const item of itens) {
    const linha = document.createElement("article");
    linha.className = "gp-admin-item";
    const media = document.createElement("div");
    media.className = "gp-admin-foto";
    media.textContent = "Carregando foto...";
    medias.set(item.id, media);
    linha.append(media);

    const descricao = document.createElement("div");
    texto(descricao, "strong", item.nome_peca, "gp-admin-item-title");
    texto(descricao, "div",
      `${item.categoria || "Sem categoria"} · ${item.cor || "Sem cor"}`, "gp-admin-item-meta");
    const disponivel = state.detalhes.get(item.peca_id)?.estoque;
    texto(descricao, "div",
      `Solicitado: ${item.quantidade} · Já enviado: ${item.quantidade_enviada ?? 0} · ` +
      `Pendente: ${item.quantidade - (item.quantidade_enviada ?? 0)} · ` +
      `Estoque atual (referência): ${disponivel ?? "—"}`,
      "gp-admin-item-meta");
    linha.append(descricao);

    const wrap = document.createElement("div");
    wrap.className = "gp-admin-quant-wrap";
    const label = document.createElement("label");
    label.className = "gp-admin-qtd-label";
    const id = `gpm-separada-${item.id}`;
    label.htmlFor = id;
    label.textContent = "Qtd. separada";
    const input = document.createElement("input");
    input.id = id;
    input.type = "number";
    input.inputMode = "numeric";
    input.min = "0";
    input.max = String(item.quantidade - (item.quantidade_enviada ?? 0));
    input.step = "1";
    input.required = true;
    input.value = String(item.quantidade_separada ?? 0);
    input.disabled = !editavel;
    input.className = "gp-admin-quantidade";
    input.dataset.gpmQtd = item.id;
    wrap.append(label, input);
    linha.append(wrap);
    lista.append(linha);
  }

  form.append(lista);
  const resumo = texto(form, "div", "", "gp-admin-resumo");
  const aviso = texto(form, "p", "", "gp-admin-inline-info");
  atualizarResumo(form, itens, resumo, aviso);
  form.addEventListener("input", () => atualizarResumo(form, itens, resumo, aviso));

  const rodape = document.createElement("div");
  rodape.className = "gp-admin-rodape";
  const enviar = document.createElement("button");
  enviar.type = "button";
  enviar.className = "btn btn-ghost";
  enviar.textContent = "Confirmar envio e baixar estoque";
  enviar.title = "Desconta do estoque somente as quantidades separadas e salvas neste lote.";
  enviar.disabled = !editavel || !itens.some((item) => (item.quantidade_separada ?? 0) > 0);
  rodape.append(enviar);

  const salvar = document.createElement("button");
  salvar.type = "submit";
  salvar.className = "btn btn-primary";
  salvar.textContent = "Salvar separação";
  salvar.disabled = !editavel;
  rodape.append(salvar);
  form.append(rodape);

  if (!editavel) {
    texto(form, "p", "Este pedido está em modo de consulta. A separação não pode ser editada neste status.", "gp-admin-muted");
  }

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (state.salvando || state.enviando || !editavel) return;
    let payload;
    try {
      payload = validarInputs(form, itens);
    } catch (error) {
      mensagem(ui, error.message, "error");
      return;
    }
    state.salvando = true;
    salvar.disabled = true;
    mensagem(ui, `Salvando separação do pedido ${pedido.numero}...`, "loading");
    try {
      const { data, error } = await supabase.rpc("gp_salvar_separacao", {
        p_pedido_id: pedido.id,
        p_itens: payload,
        p_versao: pedido.separacao_atualizada_em || null,
      });
      if (error) throw error;
      // Libera a consulta de atualização antes de recarregar os dados.
      state.salvando = false;
      state.selecionado = pedido.id;
      await carregarPedidos(ui);
      mensagem(ui,
        `Separação registrada: ${data.total_separado} no lote, ${data.total_enviado} já enviadas. Ainda pendentes: ${data.total_pendente}.`,
        "success");
    } catch (error) {
      console.error("[YXZ] Falha ao salvar separação:", error);
      mensagem(ui, `Não foi possível salvar: ${error.message}. Reabra o pedido e confira antes de tentar novamente.`, "error");
      salvar.disabled = false;
    } finally {
      state.salvando = false;
    }
  });
  // Um identificador fixo por tentativa: reenvio da mesma tentativa nao duplica a baixa.
  const chaveEnvio = crypto.randomUUID();
  enviar.addEventListener("click", async () => {
    if (state.enviando || state.salvando || !editavel) return;
    let valores;
    try {
      valores = validarInputs(form, itens);
    } catch (error) {
      mensagem(ui, error.message, "error");
      return;
    }

    // Nunca expedir valores digitados que ainda nao foram salvos.
    if (valores.some((v) => v.quantidade_separada !==
        (itens.find((i) => i.id === v.item_id)?.quantidade_separada ?? 0))) {
      mensagem(ui, "Voce alterou quantidades. Salve a separacao antes de confirmar o envio.", "error");
      return;
    }
    const lote = valores.reduce((total, item) => total + item.quantidade_separada, 0);
    if (lote < 1) {
      mensagem(ui, "Separe e salve ao menos uma peca antes de enviar.", "error");
      return;
    }
    const total = itens.reduce((s, i) => s + i.quantidade, 0);
    const jaEnviado = itens.reduce((s, i) => s + (i.quantidade_enviada ?? 0), 0);
    const pendenteApos = total - jaEnviado - lote;
    const avisoEnvio = `Confirmar envio de ${lote} unidade(s) do pedido ${pedido.numero}?\n` +
      `Serao descontadas ${lote} unidade(s) do estoque.\n` +
      (pendenteApos > 0
        ? `Restarao ${pendenteApos} unidade(s) pendentes para um proximo envio.`
        : "Este envio atendera integralmente o pedido.") +
      "\nEsta operacao nao pode ser desfeita por este modulo.";
    if (!window.confirm(avisoEnvio)) return;
    state.enviando = true;
    enviar.disabled = true;
    salvar.disabled = true;
    mensagem(ui, `Confirmando envio de ${pedido.numero} e atualizando estoque...`, "loading");
    try {
      const { data, error } = await supabase.rpc("gp_confirmar_envio", {
        p_pedido_id: pedido.id,
        p_versao: pedido.separacao_atualizada_em,
        p_chave_idempotencia: chaveEnvio,
      });
      if (error) throw error;
      state.enviando = false;
      state.selecionado = pedido.id;
      await carregarPedidos(ui);
      mensagem(ui,
        `Envio ${data.repetido ? "ja confirmado" : "confirmado"}: ` +
        `${data.total_enviado_lote} unidade(s). Status: ${data.status}. ` +
        `Pendente: ${data.total_pendente ?? "consulte detalhes"}.`,
        "success");
    } catch (error) {
      console.error("[YXZ] Erro ao confirmar envio:", error);
      mensagem(ui,
        `Nao foi possivel confirmar o resultado: ${error.message}. ` +
        "Atualize o pedido e confira o estoque e os envios antes de tentar novamente.",
        "error");
      // A mesma chave so vale para esta instancia do formulario.
      // Bloqueia nova tentativa sem recarregar o pedido e conferir resultado.
    } finally {
      state.enviando = false;
    }
  });

  ui.detalhe.append(form);
  carregarImagens(itens, medias, ui);
}

async function abrirPedido(ui, pedidoId) {
  const pedido = state.pedidos.find((p) => p.id === pedidoId);
  if (!pedido) return;
  state.selecionado = pedido.id;
  const seq = ++state.sequencia;
  pintarLista(ui);
  ui.detalhe.replaceChildren();
  texto(ui.detalhe, "p", "Carregando pedido e fotografias...", "gp-admin-muted");
  try {
    const { data: itens, error: itensErro } = await supabase
      .from("gp_itens_pedido")
      .select("id,pedido_id,peca_id,nome_peca,categoria,cor,quantidade,quantidade_separada,quantidade_enviada")
      .eq("pedido_id", pedido.id)
      .order("nome_peca");
    if (itensErro) throw itensErro;
    if (!itens?.length) throw new Error("Pedido sem itens visíveis. Confira a RLS.");
    const ids = [...new Set(itens.map((item) => item.peca_id))];
    const { data: pecas, error: pecaErro } = await supabase
      .from("gp_pecas")
      .select("id,imagem_path,estoque")
      .in("id", ids);
    if (pecaErro) throw pecaErro;
    if (seq !== state.sequencia) return;
    state.itens = itens;
    state.detalhes = new Map((pecas || []).map((peca) => [peca.id, peca]));
    renderizarDetalhes(ui, pedido, itens);
    const url = new URL(window.location.href);
    url.searchParams.set("pedido", pedido.id);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  } catch (error) {
    if (seq !== state.sequencia) return;
    console.error("[YXZ] Erro ao abrir pedido:", error);
    ui.detalhe.replaceChildren();
    texto(ui.detalhe, "p", `Erro ao carregar o pedido: ${error.message}`, "gp-admin-muted");
  }
}

export async function initPecasPedidosPage() {
  const ui = refs();
  for (const filtro of [ui.busca, ui.status, ui.oficina, ui.regional]) {
    filtro.addEventListener(filtro === ui.busca ? "input" : "change", () => pintarLista(ui));
  }
  ui.atualizar.addEventListener("click", () => carregarPedidos(ui));
  try {
    mensagem(ui, "Preparando gestão de pedidos...", "loading");
    await carregarReferencias(ui);
    await carregarPedidos(ui);
  } catch (error) {
    console.error("[YXZ] Erro ao iniciar gestão:", error);
    mensagem(ui, `Falha ao iniciar: ${error.message}`, "error");
  }
}
