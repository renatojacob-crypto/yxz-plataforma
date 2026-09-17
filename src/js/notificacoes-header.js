import { supabase } from "./supabase.js";
import { appUrl } from "./paths.js";

/*
 * Indicador de avisos em todas as paginas privadas.
 * Inicia somente depois de requireAuth() no main.js.
 * Atualiza ao carregar, ao retornar a aba e a cada 60 segundos.
 */
export function initIndicadorNotificacoes() {
  const header = document.querySelector(".header-user");
  if (!header || header.querySelector("[data-gp-avisos-link]")) return;

  const link = document.createElement("a");
  link.href = appUrl("pecas-notificacoes.html");
  link.className = "gp-alerta-link";
  link.dataset.gpAvisosLink = "";
  link.setAttribute("aria-label", "Avisos de pedidos");
  link.textContent = "🔔 Avisos";

  const badge = document.createElement("span");
  badge.className = "gp-alerta-contagem";
  badge.hidden = true;
  badge.setAttribute("aria-live", "polite");
  link.append(badge);
  header.prepend(link);

  let encerrado = false;
  let consultando = false;
  let ultimaConsulta = 0;

  async function atualizar() {
    if (encerrado || consultando || document.hidden) return;
    consultando = true;
    try {
      const { count, error } = await supabase
        .from("gp_notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("lida", false);

      if (error) throw error;
      if (encerrado) return;

      const numero = count ?? 0;
      badge.hidden = numero === 0;
      badge.textContent = numero > 99 ? "99+" : String(numero);
      link.setAttribute(
        "aria-label",
        numero === 0
          ? "Avisos de pedidos: nenhum não lido"
          : `Avisos de pedidos: ${numero} não lido(s)`,
      );
      ultimaConsulta = Date.now();
    } catch (error) {
      console.warn("[YXZ] Contagem de notificações indisponível:", error.message);
      // Falha de rede nao deve esconder um aviso valido obtido anteriormente.
    } finally {
      consultando = false;
    }
  }

  const aoRetornar = () => {
    if (!document.hidden && Date.now() - ultimaConsulta > 5000) {
      void atualizar();
    }
  };
  const aoSinal = () => { void atualizar(); };
  const intervalo = window.setInterval(aoSinal, 60000);
  document.addEventListener("visibilitychange", aoRetornar);
  window.addEventListener("focus", aoRetornar);
  window.addEventListener("gp:notificacoes-atualizadas", aoSinal);

  window.addEventListener("pagehide", () => {
    encerrado = true;
    window.clearInterval(intervalo);
    document.removeEventListener("visibilitychange", aoRetornar);
    window.removeEventListener("focus", aoRetornar);
    window.removeEventListener("gp:notificacoes-atualizadas", aoSinal);
  }, { once: true });

  void atualizar();
}
