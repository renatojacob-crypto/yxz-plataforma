import "./css/tokens.css";
import "./css/base.css";
import "./css/public.css";

import {
  initPublicSite,
} from "./js/public-site.js";

function iniciarSitePublico() {
  try {
    initPublicSite();

    if (import.meta.env.DEV) {
      console.info(
        "Site público YXZ carregado em modo de desenvolvimento.",
      );
    }
  } catch (erro) {
    console.error(
      "[YXZ] Erro ao inicializar o site público:",
      erro,
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  iniciarSitePublico,
);