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

        app: resolve(
          process.cwd(),
          "app/index.html",
        ),
      },
    },
  },
});