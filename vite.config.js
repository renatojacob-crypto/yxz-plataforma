import {
  defineConfig,
} from "vite";

import {
  resolve,
} from "node:path";


/* =========================================================
   GITHUB PAGES
========================================================= */

const githubRepository =
  process.env.GITHUB_REPOSITORY
    ?.split("/")
    .pop();

const isGitHubActions =
  process.env.GITHUB_ACTIONS ===
  "true";

const base =
  isGitHubActions
    ? `/${githubRepository || "yxz-plataforma"}/`
    : "/";


/* =========================================================
   PLUGIN DE NAVEGAÇÃO YXZ
========================================================= */

function yxzHtmlNavigationPlugin() {
  return {
    name: "yxz-html-navigation-base",

    transformIndexHtml(html) {
      if (base === "/") {
        return html;
      }

      return html
        .replace(
          /href="\/app\//g,
          `href="${base}app/`,
        )
        .replace(
          /href="\/"/g,
          `href="${base}"`,
        );
    },
  };
}


/* =========================================================
   CONFIGURAÇÃO PRINCIPAL
========================================================= */

export default defineConfig({
  base,

  plugins: [
    yxzHtmlNavigationPlugin(),
  ],

  build: {
    rollupOptions: {
      input: {

        /* ================================================
           PÁGINAS PÚBLICAS
        ================================================= */

        public: resolve(
          process.cwd(),
          "index.html",
        ),

        obrigado: resolve(
          process.cwd(),
          "obrigado.html",
        ),


        /* ================================================
           AUTENTICAÇÃO
        ================================================= */

        login: resolve(
          process.cwd(),
          "app/login.html",
        ),

        definirSenha: resolve(
          process.cwd(),
          "app/definir-senha.html",
        ),

        redefinirSenha: resolve(
          process.cwd(),
          "app/redefinir-senha.html",
        ),


        /* ================================================
           PORTAL PRINCIPAL
        ================================================= */

        app: resolve(
          process.cwd(),
          "app/index.html",
        ),


        /* ================================================
           USUÁRIOS
        ================================================= */

        usuarios: resolve(
          process.cwd(),
          "app/usuarios.html",
        ),


        /* ================================================
           OFICINAS E EVENTOS
        ================================================= */

        agendamentos: resolve(
          process.cwd(),
          "app/agendamentos.html",
        ),

        calendario: resolve(
          process.cwd(),
          "app/calendario.html",
        ),

        escalas: resolve(
          process.cwd(),
          "app/escalas.html",
        ),

        execucoes: resolve(
          process.cwd(),
          "app/execucoes.html",
        ),


        /* ================================================
           EQUIPE
        ================================================= */

        instrutores: resolve(
          process.cwd(),
          "app/instrutores.html",
        ),

        horas: resolve(
          process.cwd(),
          "app/horas.html",
        ),

        conferencia: resolve(
          process.cwd(),
          "app/conferencia.html",
        ),


        /* ================================================
           FINANCEIRO
        ================================================= */

        previsoes: resolve(
          process.cwd(),
          "app/previsoes.html",
        ),

        gastos: resolve(
          process.cwd(),
          "app/gastos.html",
        ),

        comparativo: resolve(
          process.cwd(),
          "app/comparativo.html",
        ),


        /* ================================================
           GESTÃO E RELATÓRIOS
        ================================================= */

        relatorios: resolve(
          process.cwd(),
          "app/relatorios.html",
        ),

        faturamento: resolve(
          process.cwd(),
          "app/faturamento.html",
        ),


        /* ================================================
           GESTÃO DE PEÇAS — ETAPA 3
           CATÁLOGO E SOLICITAÇÃO
        ================================================= */

        pecas: resolve(
          process.cwd(),
          "app/pecas.html",
        ),


        /* ================================================
           GESTÃO DE PEÇAS — ETAPA 4
           GESTÃO E SEPARAÇÃO DE PEDIDOS
        ================================================= */

        pecasCadastro: resolve(
          process.cwd(),
          "app/pecas-cadastro.html",
        ),

        pecasPedidos: resolve(
          process.cwd(),
          "app/pecas-pedidos.html",
        ),


        /* ================================================
           GESTÃO DE PEÇAS — ETAPA 6
           NOTIFICAÇÕES
        ================================================= */
        pecasNotificacoes: resolve(
          process.cwd(),
          "app/pecas-notificacoes.html",
        ),

        /* ================================================
           GESTÃO DE PEÇAS — ETAPA 6
           DASHBOARD
          ================================================= */

        pecasDashboard: resolve(
          process.cwd(),
          "app/pecas-dashboard.html",
        ),

      },
    },
  },
});