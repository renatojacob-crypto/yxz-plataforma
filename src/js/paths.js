/* =========================================================
   YXZ PLATAFORMA
   CAMINHOS / BASE URL

   Local:
   /

   GitHub Pages:
   /yxz-plataforma/
========================================================= */


const rawBaseUrl =
  import.meta.env.BASE_URL ||
  "/";


export const BASE_URL =
  rawBaseUrl.endsWith(
    "/",
  )
    ? rawBaseUrl
    : `${rawBaseUrl}/`;


export const APP_BASE_URL =
  `${BASE_URL}app/`;


/* =========================================================
   UTILIDADES INTERNAS
========================================================= */

function removeLeadingSlashes(
  value,
) {
  return String(
    value ||
    "",
  ).replace(
    /^\/+/,
    "",
  );
}


/* =========================================================
   URL DO SITE
========================================================= */

export function siteUrl(
  path = "",
) {
  const cleanPath =
    removeLeadingSlashes(
      path,
    );


  if (!cleanPath) {
    return BASE_URL;
  }


  return `${BASE_URL}${cleanPath}`;
}


/* =========================================================
   URL DO PORTAL
========================================================= */

export function appUrl(
  path = "",
) {
  const cleanPath =
    removeLeadingSlashes(
      path,
    );


  if (!cleanPath) {
    return APP_BASE_URL;
  }


  return `${APP_BASE_URL}${cleanPath}`;
}


/* =========================================================
   URL ABSOLUTA DO SITE
========================================================= */

export function absoluteSiteUrl(
  path = "",
) {
  return new URL(
    siteUrl(
      path,
    ),
    window.location.origin,
  ).href;
}


/* =========================================================
   URL ABSOLUTA DO PORTAL
========================================================= */

export function absoluteAppUrl(
  path = "",
) {
  return new URL(
    appUrl(
      path,
    ),
    window.location.origin,
  ).href;
}


/* =========================================================
   CAMINHO BASE DO PORTAL
========================================================= */

export function getAppBasePath() {
  return new URL(
    appUrl(),
    window.location.origin,
  ).pathname;
}


/* =========================================================
   VALIDAR REDIRECT INTERNO

   Aceita somente URLs da mesma origem e dentro
   da área /app/ da instalação atual.
========================================================= */

export function isSafeAppLocation(
  value,
) {
  if (!value) {
    return false;
  }


  try {

    const target =
      new URL(
        value,
        window.location.origin,
      );


    if (
      target.origin !==
      window.location.origin
    ) {
      return false;
    }


    const appBasePath =
      getAppBasePath();


    const appBaseWithoutSlash =
      appBasePath.replace(
        /\/$/,
        "",
      );


    return (
      target.pathname ===
        appBaseWithoutSlash

      ||

      target.pathname.startsWith(
        appBasePath,
      )
    );

  } catch {

    return false;
  }
}


/* =========================================================
   NORMALIZAR REDIRECT SEGURO
========================================================= */

export function normalizeSafeAppLocation(
  value,
  fallback = appUrl(),
) {
  if (
    !isSafeAppLocation(
      value,
    )
  ) {
    return fallback;
  }


  const target =
    new URL(
      value,
      window.location.origin,
    );


  return (
    target.pathname +
    target.search +
    target.hash
  );
}
