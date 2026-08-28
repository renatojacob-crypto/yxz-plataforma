import {
  defineConfig,
} from "vite";


import {
  resolve,
} from "node:path";


export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        public: resolve(
          process.cwd(),
          "index.html",
        ),

        obrigado: resolve(
          process.cwd(),
          "obrigado.html",
        ),

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

        app: resolve(
          process.cwd(),
          "app/index.html",
        ),

        usuarios: resolve(
          process.cwd(),
          "app/usuarios.html",
        ),

        instrutores: resolve(
          process.cwd(),
          "app/instrutores.html",
        ),

        agendamentos: resolve(
          process.cwd(),
          "app/agendamentos.html",
        ),

        escalas: resolve(
          process.cwd(),
          "app/escalas.html",
        ),

        execucoes: resolve(
          process.cwd(),
          "app/execucoes.html",
        ),

        horas: resolve(
          process.cwd(),
          "app/horas.html",
        ),

        conferencia: resolve(
          process.cwd(),
          "app/conferencia.html",
        ),

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

        relatorios: resolve(
          process.cwd(),
          "app/relatorios.html",
        ),

        faturamento: resolve(
          process.cwd(),
          "app/faturamento.html",
        ),
      },
    },
  },
});