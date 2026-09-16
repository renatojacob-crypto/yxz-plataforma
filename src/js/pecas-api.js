/**
 * API do módulo de peças, usando a sessão JÁ EXISTENTE do Portal.
 *
 * Caminho: src/js/pecas-api.js
 * Importação em páginas do Portal:
 *   import { apiGetPecas, apiPostPecas } from "./pecas-api.js";
 *
 * Não existe URL do Apps Script nem segredo no navegador.
 */
import { supabase } from "./supabase.js";

const NOME_FUNCAO = "yxz-pecas";
const cache = new Map();
const pendentes = new Map();

function duracao(acao) {
  if (acao === "config") return 5 * 60_000;
  if (acao === "pecas") return 20_000;
  return 0;
}

function chave(acao, parametros) {
  return JSON.stringify([
    acao,
    Object.entries(parametros).sort((a, b) => a[0].localeCompare(b[0])),
  ]);
}

async function enviar(acao, parametros = {}, payload = {}) {
  // supabase-js anexa o JWT da sessão na invocação.
  const { data, error } = await supabase.functions.invoke(NOME_FUNCAO, {
    body: { acao, parametros, payload },
  });

  if (error) {
    let mensagem = "Não foi possível consultar o sistema de peças.";
    // FunctionsHttpError traz resposta HTTP (muitas vezes com JSON).
    if (error.context && typeof error.context.json === "function") {
      try {
        const detalhe = await error.context.json();
        mensagem = detalhe?.erro || mensagem;
      } catch {
        // Mantém mensagem segura.
      }
    }
    throw new Error(mensagem);
  }

  if (!data || data.sucesso !== true) {
    throw new Error(data?.erro || "Resposta inválida da integração.");
  }
  return data.dados;
}

export async function apiGetPecas(acao, parametros = {}) {
  const tempo = duracao(acao);
  const id = chave(acao, parametros);
  const salvo = cache.get(id);

  if (tempo && salvo && salvo.expira > Date.now()) return salvo.dados;
  if (pendentes.has(id)) return pendentes.get(id);

  const promessa = enviar(acao, parametros).then((dados) => {
    if (tempo) cache.set(id, { dados, expira: Date.now() + tempo });
    return dados;
  });

  pendentes.set(id, promessa);
  try {
    return await promessa;
  } finally {
    pendentes.delete(id);
  }
}

export async function apiPostPecas(acao, payload = {}) {
  const dados = await enviar(acao, {}, payload);
  if (acao === "atualizarStatus") limparCachePecas();
  return dados;
}

export function limparCachePecas() {
  cache.clear();
}
