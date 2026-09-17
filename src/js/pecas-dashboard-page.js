// Portal YXZ 2.0 | Etapa 7: painel de pecas SOMENTE LEITURA.
// A autorizacao de verdade fica no RPC public.gp_relatorio_pecas.
import { supabase } from "./supabase.js";

const estado = { relatorio: null, carregando: false };
const $ = (seletor) => document.querySelector(seletor);
const numero = (valor) => Number(valor || 0).toLocaleString("pt-BR");

function no(tag, conteudo, classe = "") {
  const elemento = document.createElement(tag);
  elemento.textContent = String(conteudo ?? "");
  if (classe) elemento.className = classe;
  return elemento;
}

function avisar(texto, tipo = "") {
  const alvo = $("[data-gpd-mensagem]");
  alvo.textContent = texto;
  alvo.dataset.state = tipo;
}

function dataLocalISO(data) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0"),
  ].join("-");
}

function ultimosTrintaDias() {
  const fim = new Date();
  const inicio = new Date(fim);
  inicio.setDate(inicio.getDate() - 29);
  $("[data-gpd-inicio]").value = dataLocalISO(inicio);
  $("[data-gpd-fim]").value = dataLocalISO(fim);
  $("[data-gpd-regional]").value = "";
  $("[data-gpd-oficina]").value = "";
}

async function preencherReferencias() {
  const [regionais, oficinas] = await Promise.all([
    supabase.from("gp_regionais").select("id,nome").order("nome"),
    supabase.from("gp_oficinas").select("id,nome").order("nome"),
  ]);
  if (regionais.error) throw regionais.error;
  if (oficinas.error) throw oficinas.error;

  for (const [seletor, linhas] of [
    ["[data-gpd-regional]", regionais.data || []],
    ["[data-gpd-oficina]", oficinas.data || []],
  ]) {
    const select = $(seletor);
    for (const linha of linhas) {
      const opcao = document.createElement("option");
      opcao.value = linha.id;
      opcao.textContent = linha.nome;
      select.append(opcao);
    }
  }
}

function validarPeriodo(inicio, fim) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim)) {
    throw new Error("Preencha as duas datas.");
  }
  const diferenca = (Date.parse(`${fim}T00:00:00Z`) -
    Date.parse(`${inicio}T00:00:00Z`)) / 86400000;
  if (!Number.isFinite(diferenca) || diferenca < 0 || diferenca > 365) {
    throw new Error("Selecione um período entre 1 e 366 dias.");
  }
}

function renderizarKpis(relatorio) {
  const k = relatorio.resumo || {};
  for (const [selector, valor] of [
    ["[data-gpd-pedidos]", k.pedidos],
    ["[data-gpd-solicitadas]", k.solicitadas],
    ["[data-gpd-enviadas]", k.enviadas],
    ["[data-gpd-pendentes]", k.pendentes],
    ["[data-gpd-criticas]", k.pecas_criticas],
  ]) {
    $(selector).textContent = numero(valor);
  }
}

function renderizarBarras(seletor, linhas, obterRotulo, obterValor, obterInfo) {
  const alvo = $(seletor);
  alvo.replaceChildren();
  if (!linhas?.length) {
    alvo.append(no("p", "Nenhum registro no período.", "gp-dash-vazio"));
    return;
  }
  const maior = Math.max(1, ...linhas.map((item) => Number(obterValor(item) || 0)));
  for (const item of linhas) {
    const valor = Number(obterValor(item) || 0);
    const linha = no("div", "", "gp-dash-barra-linha");
    const cabecalho = no("div", "", "gp-dash-barra-cab");
    cabecalho.append(
      no("span", obterRotulo(item)),
      no("strong", numero(valor)),
    );
    const trilho = no("div", "", "gp-dash-barra-trilho");
    const preenchimento = no("div", "", "gp-dash-barra-preenchimento");
    preenchimento.style.width = `${Math.max(0, Math.min(100, (valor / maior) * 100))}%`;
    trilho.append(preenchimento);
    linha.append(cabecalho, trilho);
    if (obterInfo) linha.append(no("small", obterInfo(item), "gp-dash-auxiliar"));
    alvo.append(linha);
  }
}

function dataCurta(iso) {
  const partes = String(iso || "").split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}` : String(iso || "");
}

function renderizarDiario(linhas) {
  const alvo = $("[data-gpd-diario]");
  alvo.replaceChildren();
  if (!linhas?.length || !linhas.some((x) => Number(x.pedidos) > 0)) {
    alvo.append(no("p", "Nenhum pedido registrado no período.", "gp-dash-vazio"));
    return;
  }

  // Limita o numero de colunas: periodos longos sao agrupados no navegador.
  const tamanhoFaixa = Math.max(1, Math.ceil(linhas.length / 24));
  const faixas = [];
  for (let i = 0; i < linhas.length; i += tamanhoFaixa) {
    const grupo = linhas.slice(i, i + tamanhoFaixa);
    faixas.push({
      inicio: grupo[0].dia,
      fim: grupo[grupo.length - 1].dia,
      pedidos: grupo.reduce((soma, d) => soma + Number(d.pedidos || 0), 0),
    });
  }
  const maior = Math.max(1, ...faixas.map((f) => f.pedidos));
  const grade = no("div", "", "gp-dash-grafico");
  for (const faixa of faixas) {
    const coluna = no("div", "", "gp-dash-grafico-coluna");
    const track = no("div", "", "gp-dash-grafico-track");
    const barra = no("div", "", "gp-dash-grafico-valor");
    const altura = faixa.pedidos === 0
      ? 0 : Math.max(5, Math.round(faixa.pedidos / maior * 100));
    barra.style.height = `${altura}%`;
    const periodo = faixa.inicio === faixa.fim
      ? dataCurta(faixa.inicio)
      : `${dataCurta(faixa.inicio)} a ${dataCurta(faixa.fim)}`;
    coluna.title = `${periodo}: ${numero(faixa.pedidos)} pedido(s)`;
    track.append(barra);
    coluna.append(
      no("strong", numero(faixa.pedidos), "gp-dash-grafico-numero"),
      track,
      no("small", dataCurta(faixa.inicio)),
    );
    grade.append(coluna);
  }
  alvo.append(grade);
  alvo.append(no("p", "Passe o mouse sobre uma coluna para ver a faixa de datas.", "gp-dash-auxiliar"));
}

function celula(tr, valor) {
  tr.append(no("td", valor));
}

function renderizarTabela(seletor, itens, colunas) {
  const corpo = $(seletor);
  corpo.replaceChildren();
  if (!itens?.length) {
    const tr = document.createElement("tr");
    const td = no("td", "Nenhum registro para os filtros selecionados.", "gp-dash-vazio");
    td.colSpan = colunas.length;
    tr.append(td);
    corpo.append(tr);
    return;
  }
  for (const item of itens) {
    const tr = document.createElement("tr");
    for (const coluna of colunas) celula(tr, coluna(item));
    corpo.append(tr);
  }
}

function renderizar(relatorio) {
  renderizarKpis(relatorio);
  renderizarBarras("[data-gpd-status]", relatorio.status,
    (x) => x.status, (x) => x.total);
  renderizarBarras("[data-gpd-regionais]", relatorio.regionais,
    (x) => x.nome, (x) => x.pedidos,
    (x) => `${numero(x.unidades)} unidade(s) solicitada(s)`);
  renderizarBarras("[data-gpd-oficinas]", relatorio.oficinas,
    (x) => x.nome, (x) => x.pedidos,
    (x) => `${numero(x.unidades)} unidade(s) solicitada(s)`);
  renderizarDiario(relatorio.diario);
  renderizarTabela("[data-gpd-top]", relatorio.top_pecas, [
    (x) => x.codigo, (x) => x.nome,
    (x) => numero(x.solicitadas), (x) => numero(x.enviadas),
  ]);
  renderizarTabela("[data-gpd-recentes]", relatorio.recentes, [
    (x) => x.numero, (x) => x.dia,
    (x) => `${x.regional} / ${x.oficina}`,
    (x) => x.status, (x) => numero(x.solicitadas), (x) => numero(x.enviadas),
  ]);
  renderizarTabela("[data-gpd-estoque]", relatorio.estoque_critico, [
    (x) => `${x.codigo} · ${x.nome}`,
    (x) => numero(x.estoque), (x) => numero(x.minimo),
  ]);
  $("[data-gpd-conteudo]").hidden = false;
  $("[data-gpd-csv]").disabled = false;
}

async function carregar() {
  if (estado.carregando) return;
  estado.carregando = true;
  estado.relatorio = null;
  $("[data-gpd-conteudo]").hidden = true;
  const aplicar = $("[data-gpd-aplicar]");
  const csv = $("[data-gpd-csv]");
  aplicar.disabled = true;
  csv.disabled = true;
  avisar("Consultando relatório no Supabase...", "loading");
  try {
    const inicio = $("[data-gpd-inicio]").value;
    const fim = $("[data-gpd-fim]").value;
    validarPeriodo(inicio, fim);
    const { data, error } = await supabase.rpc("gp_relatorio_pecas", {
      p_inicio: inicio,
      p_fim: fim,
      p_regional_id: $("[data-gpd-regional]").value || null,
      p_oficina_id: $("[data-gpd-oficina]").value || null,
    });
    if (error) throw error;
    if (!data || typeof data !== "object" || !data.resumo) {
      throw new Error("Formato inesperado do relatório. Confira o SQL 17.");
    }
    estado.relatorio = data;
    renderizar(data);
    avisar(`Relatório atualizado: ${inicio} a ${fim}.`, "success");
  } catch (erro) {
    console.error("[YXZ] Falha ao consultar dashboard de peças:", erro);
    avisar(`Não foi possível carregar o relatório: ${erro.message}`, "error");
  } finally {
    estado.carregando = false;
    aplicar.disabled = false;
    csv.disabled = !estado.relatorio;
  }
}

// Exporta as MESMAS secoes resumidas da tela. Pedidos recentes: no maximo 20.
function formatarCampoCsv(valor) {
  let s = String(valor ?? "").replace(/\r?\n/g, " ");
  if (/^\s*[=+\-@\t]/.test(s)) s = `'${s}`; // protege contra formulas em planilhas
  return `"${s.replace(/"/g, '""')}"`;
}

function exportarCsv() {
  const r = estado.relatorio;
  if (!r) return;
  const linhas = [];
  const adicionar = (...valores) => linhas.push(valores.map(formatarCampoCsv).join(";"));
  adicionar("Relatório de peças YXZ");
  adicionar("Início", r.periodo.inicio, "Fim", r.periodo.fim);
  adicionar("Critério", "Data do pedido; enviados acumulados até agora; estoque crítico global");
  adicionar("");
  adicionar("RESUMO", "Total");
  for (const [nome, valor] of [
    ["Pedidos", r.resumo.pedidos],
    ["Solicitadas", r.resumo.solicitadas],
    ["Enviadas", r.resumo.enviadas],
    ["Pendentes (exceto cancelados)", r.resumo.pendentes],
    ["Peças com estoque crítico global", r.resumo.pecas_criticas],
  ]) adicionar(nome, valor);
  adicionar("");
  adicionar("STATUS", "Pedidos");
  for (const x of r.status) adicionar(x.status, x.total);
  for (const [titulo, grupo] of [
    ["REGIONAIS", r.regionais], ["OFICINAS", r.oficinas],
  ]) {
    adicionar("");
    adicionar(titulo, "Pedidos", "Unidades solicitadas");
    for (const x of grupo) adicionar(x.nome, x.pedidos, x.unidades);
  }
  adicionar("");
  adicionar("TOP 10 PEÇAS", "Nome", "Solicitadas", "Enviadas");
  for (const x of r.top_pecas) adicionar(x.codigo, x.nome, x.solicitadas, x.enviadas);
  adicionar("");
  adicionar("EVOLUÇÃO DIÁRIA", "Pedidos", "Unidades solicitadas");
  for (const x of r.diario) adicionar(x.dia, x.pedidos, x.unidades);
  adicionar("");
  adicionar("PEDIDOS RECENTES (ATÉ 20)", "Data", "Regional", "Oficina", "Status", "Solicitadas", "Enviadas");
  for (const x of r.recentes) {
    adicionar(x.numero, x.dia, x.regional, x.oficina, x.status, x.solicitadas, x.enviadas);
  }
  adicionar("");
  adicionar("ESTOQUE CRÍTICO GLOBAL (ATÉ 20)", "Nome", "Estoque", "Mínimo");
  for (const x of r.estoque_critico) adicionar(x.codigo, x.nome, x.estoque, x.minimo);

  const blob = new Blob(["\uFEFF", linhas.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `yxz-pecas-relatorio-${r.periodo.inicio}-${r.periodo.fim}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function initPecasDashboardPage() {
  const form = $("[data-gpd-filtros]");
  if (!form) throw new Error("Página pecas-dashboard.html sem formulário de filtros.");
  ultimosTrintaDias();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void carregar();
  });
  $("[data-gpd-limpar]").addEventListener("click", () => {
    ultimosTrintaDias();
    void carregar();
  });
  $("[data-gpd-csv]").addEventListener("click", exportarCsv);
  try {
    await preencherReferencias();
    await carregar();
  } catch (erro) {
    console.error("[YXZ] Falha ao inicializar dashboard de peças:", erro);
    avisar(`Erro inicial: ${erro.message}`, "error");
  }
}
