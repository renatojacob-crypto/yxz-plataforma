/*
 * Portal YXZ 2.0 — Compartilhamento manual das escalas por WhatsApp.
 * Não faz requisições, não envia mensagens e não modifica o Supabase.
 * Os dados são recebidos do módulo Escalas, após a consulta existente.
 */

function localDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeLine(value, fallback = "Não informado") {
  const cleaned = String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}

function formatBR(iso) {
  const [year, month, day] = String(iso || "").split("-");
  if (!year || !month || !day) return safeLine(iso);
  return `${day}/${month}/${year}`;
}

function formatWeekday(iso) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return formatBR(iso);
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(date);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} • ${formatBR(iso)}`;
}

function formatTime(value) {
  return String(value ?? "").slice(0, 5) || "--:--";
}

function textCompare(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), "pt-BR");
}

/*
 * Função independente da interface: facilita os testes e evita
 * copiar contatos, e-mails, telefones ou outros dados pessoais.
 */
export function gerarTextoEscalaWhatsapp({
  regionalId,
  inicio,
  fim,
  incluirSemEscala = false,
  regionais = [],
  escolas = [],
  oficinas = [],
  escalas = [],
  instrutores = [],
} = {}) {
  if (!regionalId || !regionais.some((item) => item.id === regionalId)) {
    return { texto: "", total: 0, erro: "Selecione uma regional válida." };
  }

  if (!inicio || !fim || inicio > fim) {
    return { texto: "", total: 0, erro: "Informe um período válido (data inicial até data final)." };
  }

  const regional = regionais.find((item) => item.id === regionalId);
  const escolasPorId = new Map(escolas.map((item) => [item.id, item]));
  const instrutoresPorId = new Map(instrutores.map((item) => [item.id, item]));
  const escalasPorEvento = new Map();

  escalas.forEach((escala) => {
    if (!escalasPorEvento.has(escala.evento_id)) {
      escalasPorEvento.set(escala.evento_id, []);
    }
    escalasPorEvento.get(escala.evento_id).push(escala);
  });

  const selecionadas = oficinas
    .filter((oficina) => {
      if (oficina.regional_id !== regionalId
        || oficina.tipo_evento !== "oficina_educacional"
        || oficina.status !== "agendada"
        || !oficina.data
        || oficina.data < inicio
        || oficina.data > fim) {
        return false;
      }
      return incluirSemEscala
        || (escalasPorEvento.get(oficina.id) ?? []).length > 0;
    })
    .sort((a, b) => a.data.localeCompare(b.data)
      || String(a.hora_inicio ?? "").localeCompare(String(b.hora_inicio ?? ""))
      || textCompare(a.atividade, b.atividade));

  if (!selecionadas.length) {
    return {
      texto: "",
      total: 0,
      erro: "Nenhuma oficina agendada corresponde à regional, ao período e à opção de escala selecionados.",
    };
  }

  const linhas = [
    "📣 *ESCALA DE OFICINAS | YXZ*",
    `📍 *Regional:* ${safeLine(regional.nome)}`,
    `🗓️ *Período:* ${formatBR(inicio)} a ${formatBR(fim)}`,
    "",
    "Olá, equipe! 👋 Segue a programação de oficinas:",
  ];

  let dataAnterior = "";

  selecionadas.forEach((oficina, indice) => {
    if (oficina.data !== dataAnterior) {
      linhas.push("", `📅 *${formatWeekday(oficina.data)}*`);
      dataAnterior = oficina.data;
    }

    const escola = escolasPorId.get(oficina.escola_id);
    const local = [escola?.cidade, escola?.uf]
      .filter(Boolean)
      .map((item) => safeLine(item))
      .join(" / ");

    const ids = [...new Set(
      (escalasPorEvento.get(oficina.id) ?? []).map((escala) => escala.instrutor_id),
    )];
    const nomes = ids
      .map((id) => instrutoresPorId.get(id)?.nome)
      .map((nome) => safeLine(nome, "Instrutor não identificado"))
      .sort(textCompare);

    linhas.push(
      "",
      `*${indice + 1}. ${safeLine(oficina.atividade, "Oficina")}*`,
      `🏫 *Escola:* ${safeLine(escola?.nome, "Escola não identificada")}${local ? ` (${local})` : ""}`,
      `⏰ *Horário:* ${formatTime(oficina.hora_inicio)} às ${formatTime(oficina.hora_fim)}`,
      nomes.length
        ? `👥 *Instrutores:* ${nomes.join(", ")}`
        : "⚠️ *Instrutores:* escala ainda não definida",
    );
  });

  linhas.push(
    "",
    `✅ *Total:* ${selecionadas.length} oficina(s).`,
    "ℹ️ A programação pode mudar. Confiram a escala atualizada no Portal YXZ antes de cada atividade.",
  );

  return {
    texto: linhas.join("\n"),
    total: selecionadas.length,
    erro: "",
  };
}

export function iniciarCompartilhamentoEscalas({ obterDados, autorizado }) {
  const painel = document.querySelector("[data-whatsapp-escalas]");
  if (!painel || !autorizado) return { invalidar() {} };

  const regional = painel.querySelector("[data-whatsapp-regional]");
  const inicio = painel.querySelector("[data-whatsapp-inicio]");
  const fim = painel.querySelector("[data-whatsapp-fim]");
  const incluirSemEscala = painel.querySelector("[data-whatsapp-incluir-sem-escala]");
  const gerar = painel.querySelector("[data-whatsapp-gerar]");
  const copiar = painel.querySelector("[data-whatsapp-copiar]");
  const previa = painel.querySelector("[data-whatsapp-previa]");
  const aviso = painel.querySelector("[data-whatsapp-aviso]");
  const total = painel.querySelector("[data-whatsapp-total]");

  if ([regional, inicio, fim, incluirSemEscala, gerar, copiar, previa, aviso, total]
    .some((item) => !item)) {
    return { invalidar() {} };
  }

  const dados = obterDados();
  regional.replaceChildren(new Option("Selecione sua regional", ""));
  dados.regionais
    .filter((item) => item.ativo !== false)
    .forEach((item) => regional.add(new Option(item.nome, item.id)));

  const agora = new Date();
  const ultimo = new Date(agora);
  ultimo.setDate(ultimo.getDate() + 6);
  inicio.value = localDateISO(agora);
  fim.value = localDateISO(ultimo);

  function mensagem(texto = "", estado = "") {
    aviso.textContent = texto;
    aviso.dataset.estado = estado;
  }

  function invalidar(texto = "Os filtros ou a escala mudaram. Gere a mensagem novamente.") {
    previa.value = "";
    copiar.disabled = true;
    total.textContent = "";
    mensagem(texto, "");
  }

  [regional, inicio, fim, incluirSemEscala].forEach((elemento) => {
    elemento.addEventListener("change", () => invalidar());
  });

  gerar.addEventListener("click", () => {
    const atuais = obterDados();
    const resultado = gerarTextoEscalaWhatsapp({
      regionalId: regional.value,
      inicio: inicio.value,
      fim: fim.value,
      incluirSemEscala: incluirSemEscala.checked,
      regionais: atuais.regionais,
      escolas: atuais.escolas,
      oficinas: atuais.oficinas,
      escalas: atuais.escalas,
      instrutores: atuais.instrutores,
    });

    previa.value = resultado.texto;
    copiar.disabled = !resultado.texto;
    total.textContent = resultado.total
      ? `${resultado.total} oficina(s) incluída(s)`
      : "";
    mensagem(
      resultado.erro || "Revise o texto e clique em Copiar mensagem.",
      resultado.erro ? "erro" : "sucesso",
    );
  });

  previa.addEventListener("input", () => {
    copiar.disabled = !previa.value.trim();
  });

  copiar.addEventListener("click", async () => {
    const texto = previa.value.trim();
    if (!texto) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API indisponível.");
      }
      await navigator.clipboard.writeText(texto);
      mensagem("Mensagem copiada! Abra o WhatsApp Web e cole no grupo correto.", "sucesso");
    } catch {
      // Alternativa para navegadores que bloqueiam Clipboard API.
      previa.focus();
      previa.select();
      const funcionou = typeof document.execCommand === "function"
        && document.execCommand("copy");
      mensagem(
        funcionou
          ? "Mensagem copiada! Abra o WhatsApp Web e cole no grupo correto."
          : "Cópia automática indisponível. Selecione o texto e pressione Ctrl+C.",
        funcionou ? "sucesso" : "erro",
      );
    }
  });

  painel.hidden = false;
  return { invalidar };
}
