/**
 * Portal YXZ 2.0 | Gestão de Peças - Etapa 3
 * Catálogo + carrinho + criação transacional no Supabase.
 * Não altera estoque nem envia e-mail nesta etapa.
 */
import { supabase } from "./supabase.js";
import { getCurrentUser } from "./auth.js";

const TAMANHO_PAGINA = 500;
const MAX_TIPOS = 100;
const MAX_QUANTIDADE = 10000;
const ordenar = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

const estado = {
  pecas: [],
  oficinas: [],
  regionais: [],
  vinculos: new Map(),
  carrinho: new Map(),
  oficinaCarrinho: null,
  chavePedido: null,
  carregando: false,
  enviando: false,
  fotosAssinadas: new Map(),
};

function obterElementos() {
  const seletores = {
    oficina: "[data-gp-oficina]",
    categoria: "[data-gp-categoria]",
    busca: "[data-gp-busca]",
    atualizar: "[data-gp-refresh]",
    mensagem: "[data-gp-mensagem]",
    total: "[data-gp-total]",
    totalOficina: "[data-gp-oficina-total]",
    totalFiltros: "[data-gp-visiveis]",
    titulo: "[data-gp-titulo]",
    resultados: "[data-gp-resultados]",
    grid: "[data-gp-grid]",
    vazio: "[data-gp-vazio]",
    formulario: "[data-gp-form]",
    regional: "[data-gp-regional]",
    observacoes: "[data-gp-observacoes]",
    listaCarrinho: "[data-gp-carrinho]",
    qtdItens: "[data-gp-itens]",
    qtdPecas: "[data-gp-quantidade-total]",
    enviar: "[data-gp-enviar]",
    statusPedido: "[data-gp-status-pedido]",
    confirmacao: "[data-gp-confirmacao]",
    historico: "[data-gp-historico]",
    atualizarHistorico: "[data-gp-refresh-historico]",
  };
  const ui = Object.fromEntries(
    Object.entries(seletores).map(([nome, seletor]) => [nome, document.querySelector(seletor)]),
  );
  if (Object.values(ui).some((elemento) => !elemento)) {
    throw new Error("A página pecas.html está incompleta. Confira os elementos data-gp-*.");
  }
  return ui;
}

function avisar(elemento, mensagem, tipo = "") {
  elemento.textContent = mensagem;
  elemento.dataset.state = tipo;
}
function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}
function formatoNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR");
}
function opcao(valor, rotulo) {
  const item = document.createElement("option");
  item.value = valor;
  item.textContent = rotulo;
  return item;
}
function etiqueta(texto, classe) {
  const elemento = document.createElement("span");
  elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}
function botao(texto, classe = "btn btn-ghost") {
  const elemento = document.createElement("button");
  elemento.type = "button";
  elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}

async function consultarTodas(tabela, colunas, { ativos = false, ordens = ["id"] } = {}) {
  const acumulado = [];
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    let consulta = supabase.from(tabela).select(colunas);
    if (ativos) consulta = consulta.eq("ativo", true);
    ordens.forEach((coluna) => {
      consulta = consulta.order(coluna, { ascending: true });
    });
    const { data, error } = await consulta.range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw new Error(`Falha ao consultar ${tabela}: ${error.message}`);
    const pagina = data || [];
    acumulado.push(...pagina);
    if (pagina.length < TAMANHO_PAGINA) break;
  }
  return acumulado;
}

function extrairIdDrive(valor) {
  const original = String(valor ?? "").trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(original)) return original;
  try {
    const url = new URL(original);
    if (!["drive.google.com", "docs.google.com"].includes(url.hostname)) return "";
    const id = url.searchParams.get("id");
    if (id && /^[a-zA-Z0-9_-]{10,}$/.test(id)) return id;
    return url.pathname.match(/\/d\/([a-zA-Z0-9_-]{10,})/)?.[1] || "";
  } catch {
    return "";
  }
}

function colocarImagem(container, peca) {
  // Peças novas usam fotografia do bucket privado, com URL temporária.
  // Peças antigas continuam com o caminho de Drive já utilizado pelo catálogo.
  const urlAssinada = peca.imagem_path
    ? estado.fotosAssinadas.get(peca.imagem_path)
    : "";
  const id = extrairIdDrive(peca.id_drive);
  const url = urlAssinada ||
    (id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w400` : "");
  if (!url) {
    container.textContent = "Sem fotografia";
    return;
  }
  const imagem = document.createElement("img");
  imagem.alt = `Fotografia da peça ${peca.nome}`;
  imagem.loading = "lazy";
  imagem.decoding = "async";
  imagem.src = url;
  imagem.addEventListener("error", () => {
    imagem.remove();
    container.textContent = "Imagem indisponível";
  }, { once: true });
  container.append(imagem);
}

function oficinaAtual(ui) {
  return estado.oficinas.find((item) => item.id === ui.oficina.value) || null;
}
function pecasDaOficina(oficinaId) {
  if (!oficinaId) return [];
  return estado.pecas.filter(
    (peca) => peca.disponivel_todas === true
      || (estado.vinculos.get(peca.id)?.has(oficinaId) ?? false),
  );
}
function preencherOficinas(ui, anterior = "") {
  ui.oficina.replaceChildren(opcao("", "Selecione uma oficina"));
  [...estado.oficinas].sort((a, b) => ordenar.compare(a.nome, b.nome))
    .forEach((item) => ui.oficina.append(opcao(item.id, item.nome)));
  if (estado.oficinas.some((item) => item.id === anterior)) {
    ui.oficina.value = anterior;
  }
}
function preencherRegionais(ui, anterior = "") {
  ui.regional.replaceChildren(opcao("", "Selecione a regional"));
  [...estado.regionais].sort((a, b) => ordenar.compare(a.nome, b.nome))
    .forEach((item) => ui.regional.append(opcao(item.id, item.nome)));
  if (estado.regionais.some((item) => item.id === anterior)) {
    ui.regional.value = anterior;
  }
}
function preencherCategorias(ui, anterior = "") {
  const categorias = [...new Set(
    pecasDaOficina(ui.oficina.value)
      .map((peca) => (peca.categoria || "").trim() || "Sem categoria"),
  )].sort(ordenar.compare);
  ui.categoria.replaceChildren(opcao("", "Todas as categorias"));
  categorias.forEach((nome) => ui.categoria.append(opcao(nome, nome)));
  if (categorias.includes(anterior)) ui.categoria.value = anterior;
}

function invalidarTentativa() {
  // Se o conteúdo mudar, uma nova solicitação receberá uma nova chave.
  estado.chavePedido = null;
}
function carrinhoValido() {
  if (!estado.carrinho.size || estado.carrinho.size > MAX_TIPOS) return false;
  return [...estado.carrinho.values()].every(
    (item) => Number.isInteger(item.quantidade)
      && item.quantidade >= 1
      && item.quantidade <= MAX_QUANTIDADE
      && item.quantidade <= item.peca.estoque
      && estado.pecas.some((peca) => peca.id === item.peca.id && peca.ativo),
  );
}
function atualizarBotoesCards(ui) {
  ui.grid.querySelectorAll("[data-gp-adicionar]").forEach((elemento) => {
    const item = estado.carrinho.get(elemento.dataset.gpAdicionar);
    elemento.textContent = item
      ? `Adicionar mais 1 (${item.quantidade} no pedido)`
      : "Adicionar ao pedido";
    elemento.disabled = estado.enviando || Number(elemento.dataset.estoque) === 0;
  });
}
function atualizarDisponibilidade(ui) {
  const bloqueado = estado.carregando || estado.enviando;
  ui.oficina.disabled = bloqueado || !estado.oficinas.length;
  ui.categoria.disabled = bloqueado || !ui.oficina.value;
  ui.busca.disabled = bloqueado || !ui.oficina.value;
  ui.atualizar.disabled = bloqueado;
  ui.regional.disabled = bloqueado || !ui.oficina.value;
  ui.observacoes.disabled = bloqueado || !ui.oficina.value;
  ui.atualizarHistorico.disabled = bloqueado;
  ui.enviar.disabled = bloqueado || !ui.oficina.value || !ui.regional.value || !carrinhoValido();
  ui.listaCarrinho.querySelectorAll("input,button").forEach((item) => {
    item.disabled = bloqueado;
  });
  atualizarBotoesCards(ui);
}

function atualizarCarrinho(ui) {
  ui.listaCarrinho.replaceChildren();
  let totalPecas = 0;
  if (!estado.carrinho.size) {
    const vazio = document.createElement("p");
    vazio.className = "gp-cart-empty";
    vazio.textContent = "Adicione peças do catálogo para montar seu pedido.";
    ui.listaCarrinho.append(vazio);
  }
  for (const item of estado.carrinho.values()) {
    totalPecas += item.quantidade;
    const linha = document.createElement("div");
    linha.className = "gp-cart-item";
    const nome = document.createElement("strong");
    nome.textContent = item.peca.nome;
    const detalhe = document.createElement("small");
    detalhe.textContent = `${item.peca.codigo_legado} · Em estoque: ${formatoNumero(item.peca.estoque)}`;
    const controles = document.createElement("div");
    controles.className = "gp-cart-controls";
    const rotulo = document.createElement("label");
    rotulo.textContent = "Qtd.";
    const quantidade = document.createElement("input");
    quantidade.type = "number";
    quantidade.min = "1";
    quantidade.max = String(Math.min(MAX_QUANTIDADE, item.peca.estoque));
    quantidade.step = "1";
    quantidade.value = String(item.quantidade);
    quantidade.dataset.gpQuantidade = item.peca.id;
    quantidade.setAttribute("aria-label", `Quantidade de ${item.peca.nome}`);
    rotulo.append(quantidade);
    const remover = botao("Remover");
    remover.dataset.gpRemover = item.peca.id;
    controles.append(rotulo, remover);
    linha.append(nome, detalhe, controles);
    ui.listaCarrinho.append(linha);
  }
  ui.qtdItens.textContent = formatoNumero(estado.carrinho.size);
  ui.qtdPecas.textContent = formatoNumero(totalPecas);
  atualizarDisponibilidade(ui);
}

function adicionarPeca(ui, peca) {
  if (estado.enviando || estado.carregando || !ui.oficina.value) return;
  const atual = estado.carrinho.get(peca.id);
  if (!atual && estado.carrinho.size >= MAX_TIPOS) {
    avisar(ui.statusPedido, `Limite de ${MAX_TIPOS} tipos de peças por pedido.`, "error");
    return;
  }
  const novaQuantidade = (atual?.quantidade || 0) + 1;
  if (peca.estoque <= 0 || novaQuantidade > Math.min(peca.estoque, MAX_QUANTIDADE)) {
    avisar(ui.statusPedido, `Quantidade acima do estoque disponível de "${peca.nome}".`, "error");
    return;
  }
  estado.carrinho.set(peca.id, { peca, quantidade: novaQuantidade });
  estado.oficinaCarrinho = ui.oficina.value;
  invalidarTentativa();
  avisar(ui.statusPedido, `"${peca.nome}" adicionada ao pedido.`, "success");
  avisar(ui.confirmacao, "");
  atualizarCarrinho(ui);
}

function criarCard(ui, peca) {
  const card = document.createElement("article");
  card.className = "gp-card";
  const media = document.createElement("div");
  media.className = "gp-card-media";
  colocarImagem(media, peca);
  const corpo = document.createElement("div");
  corpo.className = "gp-card-body";
  const meta = document.createElement("div");
  meta.className = "gp-card-meta";
  meta.append(
    etiqueta(peca.categoria || "Sem categoria", "gp-card-category"),
    etiqueta(peca.codigo_legado, "gp-card-code"),
  );
  const titulo = document.createElement("h3");
  titulo.textContent = peca.nome;
  const cor = document.createElement("p");
  cor.textContent = `Cor: ${peca.cor || "Não informada"}`;
  const rodape = document.createElement("div");
  rodape.className = "gp-card-footer";
  let classe = "gp-stock";
  let estoque = `Estoque: ${formatoNumero(peca.estoque)}`;
  if (peca.estoque === 0) {
    classe += " gp-stock-zero";
    estoque = "Sem estoque";
  } else if (peca.estoque <= peca.estoque_minimo) {
    classe += " gp-stock-low";
    estoque = `Estoque baixo: ${formatoNumero(peca.estoque)}`;
  }
  rodape.append(
    etiqueta(estoque, classe),
    etiqueta(peca.disponivel_todas ? "Todas as oficinas" : "Oficina específica", "gp-universal"),
  );
  const adicionar = botao(peca.estoque > 0 ? "Adicionar ao pedido" : "Sem estoque", "btn btn-primary gp-add");
  adicionar.dataset.gpAdicionar = peca.id;
  adicionar.dataset.estoque = String(peca.estoque);
  adicionar.disabled = peca.estoque === 0 || estado.enviando;
  adicionar.addEventListener("click", () => adicionarPeca(ui, peca));
  corpo.append(meta, titulo, cor, rodape, adicionar);
  card.append(media, corpo);
  return card;
}

function renderizar(ui) {
  const oficina = oficinaAtual(ui);
  const base = pecasDaOficina(ui.oficina.value);
  const categoria = ui.categoria.value;
  const busca = normalizar(ui.busca.value);
  const filtradas = base.filter((peca) => {
    const categoriaPeca = (peca.categoria || "").trim() || "Sem categoria";
    const corresponde = !categoria || categoria === categoriaPeca;
    const texto = normalizar([peca.nome, peca.cor, peca.categoria, peca.codigo_legado].join(" "));
    return corresponde && (!busca || texto.includes(busca));
  }).sort((a, b) => ordenar.compare(a.nome, b.nome));
  ui.total.textContent = formatoNumero(estado.pecas.length);
  ui.totalOficina.textContent = oficina ? formatoNumero(base.length) : "—";
  ui.totalFiltros.textContent = oficina ? formatoNumero(filtradas.length) : "—";
  ui.titulo.textContent = oficina ? `Peças para ${oficina.nome}` : "Selecione uma oficina";
  ui.resultados.textContent = oficina ? `${formatoNumero(filtradas.length)} peça(s) encontrada(s)` : "";
  ui.grid.replaceChildren();
  ui.vazio.hidden = true;
  if (!oficina) return;
  if (!filtradas.length) {
    ui.vazio.hidden = false;
    return;
  }
  const fragmento = document.createDocumentFragment();
  filtradas.forEach((peca) => fragmento.append(criarCard(ui, peca)));
  ui.grid.append(fragmento);
  atualizarBotoesCards(ui);
}

async function carregarCatalogo(ui) {
  if (estado.carregando || estado.enviando) return;
  const oficinaAnterior = ui.oficina.value;
  const categoriaAnterior = ui.categoria.value;
  const regionalAnterior = ui.regional.value;
  estado.carregando = true;
  atualizarDisponibilidade(ui);
  avisar(ui.mensagem, "Consultando o Supabase...", "loading");
  try {
    const [oficinas, regionais, pecas, relacoes] = await Promise.all([
      consultarTodas("gp_oficinas", "id,nome", { ativos: true }),
      consultarTodas("gp_regionais", "id,nome", { ativos: true }),
      consultarTodas("gp_pecas",
        "id,codigo_legado,nome,categoria,cor,estoque,estoque_minimo,disponivel_todas,id_drive,imagem_path,ativo",
        { ativos: true }),
      consultarTodas("gp_pecas_oficinas", "peca_id,oficina_id", { ordens: ["peca_id", "oficina_id"] }),
    ]);
    const vinculos = new Map();
    relacoes.forEach(({ peca_id, oficina_id }) => {
      if (!vinculos.has(peca_id)) vinculos.set(peca_id, new Set());
      vinculos.get(peca_id).add(oficina_id);
    });
    // Uma única assinatura em lote, só para fotografias de novos cadastros.
    // O bucket não é tornado público; usuários ativos têm SELECT limitado
    // pela policy gp_fotos_cadastro_leitura definida no SQL da funcionalidade.
    const novosPaths = [...new Set(
      pecas.map((peca) => peca.imagem_path)
        .filter((path) => path?.startsWith("pecas/cadastros/")),
    )];
    const fotos = new Map();
    if (novosPaths.length) {
      const { data: urls, error: erroFotos } = await supabase.storage
        .from("gp-pecas").createSignedUrls(novosPaths, 900);
      if (erroFotos) {
        console.warn("[YXZ] Fotos de novos cadastros indisponíveis:", erroFotos.message);
      } else {
        novosPaths.forEach((path, i) => {
          const url = urls?.[i]?.signedUrl || urls?.[i]?.signedURL;
          if (url) fotos.set(path, url);
        });
      }
    }
    estado.fotosAssinadas = fotos;
    estado.oficinas = oficinas;
    estado.regionais = regionais;
    estado.pecas = pecas;
    estado.vinculos = vinculos;
    preencherOficinas(ui, oficinaAnterior);
    preencherRegionais(ui, regionalAnterior);
    preencherCategorias(ui, categoriaAnterior);
    // Se o cadastro foi atualizado, removemos apenas itens que deixaram
    // de existir ou não pertencem à oficina; o usuário verá as quantidades restantes.
    const disponiveis = new Map(pecasDaOficina(ui.oficina.value).map((peca) => [peca.id, peca]));
    let alterado = false;
    for (const [id, item] of estado.carrinho) {
      if (!disponiveis.has(id)) {
        estado.carrinho.delete(id);
        alterado = true;
      } else {
        item.peca = disponiveis.get(id);
      }
    }
    if (alterado) {
      if (!estado.carrinho.size) estado.oficinaCarrinho = null;
      invalidarTentativa();
      avisar(ui.statusPedido, "Uma peça indisponível foi retirada do carrinho.", "error");
    }
    renderizar(ui);
    atualizarCarrinho(ui);
    avisar(ui.mensagem, `Catálogo atualizado: ${formatoNumero(pecas.length)} peça(s) ativa(s).`, "success");
  } catch (erro) {
    console.error("[YXZ] Não foi possível atualizar catálogo:", erro);
    avisar(ui.mensagem, `Falha ao atualizar catálogo: ${erro.message}`, "error");
    // Não apaga um carrinho já montado nem substitui dados válidos por uma lista vazia.
  } finally {
    estado.carregando = false;
    atualizarDisponibilidade(ui);
  }
}

async function carregarHistorico(ui) {
  const usuario = getCurrentUser();
  if (!usuario) return;
  ui.historico.textContent = "Carregando pedidos...";
  const { data, error } = await supabase.from("gp_pedidos")
    .select("id,numero,criado_em,status,total_itens,total_pecas")
    .eq("usuario_id", usuario.id)
    .order("criado_em", { ascending: false })
    .limit(10);
  if (error) {
    console.error("[YXZ] Falha ao consultar meus pedidos:", error);
    ui.historico.textContent = "Não foi possível carregar o histórico.";
    return;
  }
  ui.historico.replaceChildren();
  if (!data?.length) {
    ui.historico.textContent = "Você ainda não possui pedidos nesta versão do sistema.";
    return;
  }
  const lista = document.createElement("ul");
  lista.className = "gp-history-list";
  for (const pedido of data) {
    const item = document.createElement("li");
    const texto = document.createElement("strong");
    texto.textContent = pedido.numero;
    const detalhe = document.createElement("span");
    const dataBr = new Date(pedido.criado_em).toLocaleString("pt-BR");
    detalhe.textContent = `${dataBr} · ${pedido.status} · ${pedido.total_itens} tipos / ${pedido.total_pecas} peças`;
    item.append(texto, detalhe);
    lista.append(item);
  }
  ui.historico.append(lista);
}

async function enviarPedido(evento, ui) {
  evento.preventDefault();
  if (estado.carregando || estado.enviando) return;
  if (!ui.oficina.value || !ui.regional.value || !carrinhoValido()) {
    avisar(ui.statusPedido, "Revise oficina, regional, quantidades e estoque antes de enviar.", "error");
    return;
  }
  if (!window.crypto?.randomUUID) {
    avisar(ui.statusPedido, "Navegador sem geração segura de identificadores. Abra o Portal por HTTPS.", "error");
    return;
  }
  // Em caso de falha de rede, manter a mesma chave permite tentar novamente
  // sem criar outra solicitação. Só gerar nova chave se os dados mudarem.
  if (!estado.chavePedido) estado.chavePedido = window.crypto.randomUUID();
  const parametros = {
    p_oficina_id: ui.oficina.value,
    p_regional_id: ui.regional.value,
    p_observacoes: ui.observacoes.value.trim(),
    p_chave_idempotencia: estado.chavePedido,
    p_itens: [...estado.carrinho.values()].map((item) => ({
      peca_id: item.peca.id,
      quantidade: item.quantidade,
    })),
  };
  estado.enviando = true;
  atualizarDisponibilidade(ui);
  avisar(ui.statusPedido, "Registrando pedido no Supabase...", "loading");
  avisar(ui.confirmacao, "");
  try {
    const { data, error } = await supabase.rpc("gp_criar_pedido", parametros);
    if (error) throw error;
    if (!data?.numero) throw new Error("Resposta inesperada do servidor. Confira 'Meus pedidos' antes de reenviar.");
    estado.carrinho.clear();
    estado.oficinaCarrinho = null;
    estado.chavePedido = null;
    ui.observacoes.value = "";
    atualizarCarrinho(ui);
    avisar(ui.statusPedido, "Pedido registrado. Estoque não foi descontado nesta etapa.", "success");
    avisar(ui.confirmacao,
      `Pedido ${data.numero} — ${data.total_itens} tipos e ${data.total_pecas} peças. Status: ${data.status}. ${data.repetido ? "Solicitação já registrada anteriormente; não houve duplicação." : "Solicitação registrada com sucesso."} O e-mail será implementado na próxima etapa.`,
      "success");
    await carregarHistorico(ui);
  } catch (erro) {
    console.error("[YXZ] Falha ao criar pedido:", erro);
    avisar(ui.statusPedido, `Não foi possível confirmar o envio: ${erro.message}. Se houve falha de conexão, consulte "Meus pedidos" antes de tentar novamente.`, "error");
  } finally {
    estado.enviando = false;
    atualizarDisponibilidade(ui);
  }
}

export async function initPecasPage() {
  const ui = obterElementos();
  ui.oficina.addEventListener("change", () => {
    if (estado.carrinho.size && estado.oficinaCarrinho !== ui.oficina.value) {
      const confirmado = window.confirm(
        "Alterar a oficina esvaziará o pedido que está sendo montado. Deseja continuar?",
      );
      if (!confirmado) {
        ui.oficina.value = estado.oficinaCarrinho || "";
        return;
      }
      estado.carrinho.clear();
      estado.oficinaCarrinho = null;
      invalidarTentativa();
      avisar(ui.statusPedido, "Oficina alterada: carrinho anterior foi esvaziado.", "error");
    }
    preencherCategorias(ui);
    ui.busca.value = "";
    avisar(ui.confirmacao, "");
    renderizar(ui);
    atualizarCarrinho(ui);
  });
  ui.categoria.addEventListener("change", () => renderizar(ui));
  ui.busca.addEventListener("input", () => renderizar(ui));
  ui.regional.addEventListener("change", () => {
    invalidarTentativa();
    atualizarDisponibilidade(ui);
  });
  ui.observacoes.addEventListener("input", invalidarTentativa);
  ui.atualizar.addEventListener("click", () => carregarCatalogo(ui));
  ui.atualizarHistorico.addEventListener("click", () => carregarHistorico(ui));
  ui.listaCarrinho.addEventListener("click", (evento) => {
    const id = evento.target.closest("[data-gp-remover]")?.dataset.gpRemover;
    if (!id || estado.enviando || estado.carregando) return;
    estado.carrinho.delete(id);
    if (!estado.carrinho.size) estado.oficinaCarrinho = null;
    invalidarTentativa();
    atualizarCarrinho(ui);
    atualizarBotoesCards(ui);
    avisar(ui.statusPedido, "Item removido.", "success");
  });
  ui.listaCarrinho.addEventListener("change", (evento) => {
    const campo = evento.target.closest("[data-gp-quantidade]");
    if (!campo || estado.enviando || estado.carregando) return;
    const item = estado.carrinho.get(campo.dataset.gpQuantidade);
    if (!item) return;
    const novo = Number(campo.value);
    if (!Number.isInteger(novo) || novo < 1
      || novo > MAX_QUANTIDADE || novo > item.peca.estoque) {
      campo.value = String(item.quantidade);
      avisar(ui.statusPedido, `Informe uma quantidade inteira entre 1 e ${Math.min(MAX_QUANTIDADE, item.peca.estoque)}.`, "error");
      return;
    }
    item.quantidade = novo;
    invalidarTentativa();
    atualizarCarrinho(ui);
  });
  ui.formulario.addEventListener("submit", (evento) => enviarPedido(evento, ui));
  await Promise.all([carregarCatalogo(ui), carregarHistorico(ui)]);
}
