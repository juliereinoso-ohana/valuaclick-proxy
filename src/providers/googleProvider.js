const axios = require("axios");

/**
 * Limpia y normaliza valores antes de agregarlos a la consulta.
 */
function limpiarValor(valor) {
  if (valor === undefined || valor === null) {
    return "";
  }

  return String(valor).trim();
}

/**
 * Construye la consulta enviada a Google Custom Search.
 *
 * No incluimos el precio exacto porque muchos portales escriben
 * los precios con formatos diferentes y eso puede eliminar
 * comparables que sí son útiles.
 */
function construirQuery(datos = {}, dominio = "") {
  const partes = [
    dominio ? `site:${dominio}` : "",
    limpiarValor(datos.operacion),
    limpiarValor(datos.tipo),
    limpiarValor(datos.colonia),
    limpiarValor(datos.ciudad),
    limpiarValor(datos.estado),
    "inmueble OR propiedad"
  ].filter(Boolean);

  return partes.join(" ");
}

/**
 * Devuelve el nombre del portal o uno genérico.
 */
function detectarPortal(nombrePortal) {
  return limpiarValor(nombrePortal) || "Portal inmobiliario";
}

/**
 * Busca publicaciones inmobiliarias mediante Google Custom Search.
 */
async function buscarEnGoogleProvider(datos = {}, portal = {}) {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_CX = process.env.GOOGLE_CX;

  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    throw new Error(
      "Faltan GOOGLE_API_KEY o GOOGLE_CX en las variables de entorno"
    );
  }

  if (!portal || !portal.dominio) {
    throw new Error("El portal no tiene un dominio válido para realizar la búsqueda");
  }

  const nombrePortal = detectarPortal(portal.nombre);
  const query = construirQuery(datos, portal.dominio);

  console.log("========== GOOGLE PROVIDER ==========");
  console.log("Portal:", nombrePortal);
  console.log("Dominio:", portal.dominio);
  console.log("Query:", query);
  console.log("=====================================");

  try {
    const response = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          key: GOOGLE_API_KEY,
          cx: GOOGLE_CX,
          q: query,
          num: 5,
          gl: "mx",
          hl: "es"
        },
        timeout: 12000
      }
    );

    const items = Array.isArray(response.data?.items)
      ? response.data.items
      : [];

    console.log(
      `Resultados encontrados en ${nombrePortal}:`,
      items.length
    );

    return items
      .filter((item) => item && item.link)
      .map((item, index) => ({
        titulo: item.title || `Resultado en ${nombrePortal}`,

        tipo: limpiarValor(datos.tipo) || null,
        operacion: limpiarValor(datos.operacion) || null,
        estado: limpiarValor(datos.estado) || null,
        ciudad: limpiarValor(datos.ciudad) || null,
        colonia: limpiarValor(datos.colonia) || null,

        /*
         * Google únicamente nos entrega título, enlace y descripción.
         * Estos datos quedan como null hasta que implementemos
         * el extractor de información de cada publicación.
         */
        precio: null,
        moneda: null,
        construccion_m2: null,
        terreno_m2: null,
        precio_m2: null,
        recamaras: null,
        banos: null,
        estacionamientos: null,
        antiguedad_anios: null,
        estado_conservacion: null,

        portal: nombrePortal,
        dominio_portal: portal.dominio,
        url_fuente: item.link,

        dias_publicado: null,
        contacto_nombre: null,
        contacto_telefono: null,
        contacto_agencia: null,

        /*
         * Este score corresponde a la relevancia inicial del portal.
         * Todavía no representa el score comercial definitivo
         * de la propiedad.
         */
        score_comercial: Math.max(
          Number(portal.score || 80) - index,
          60
        ),

        notas:
          item.snippet ||
          "Resultado obtenido mediante Google Custom Search API",

        fuente_busqueda: "google_custom_search",
        posicion_resultado: index + 1
      }));
  } catch (error) {
    const status = error.response?.status;
    const detalle =
      error.response?.data?.error?.message ||
      error.response?.data ||
      error.message;

    console.error("=========== GOOGLE ERROR ===========");
    console.error("Portal:", nombrePortal);
    console.error("Código HTTP:", status || "Sin respuesta");
    console.error("Detalle:", detalle);
    console.error("====================================");

    if (error.code === "ECONNABORTED") {
      throw new Error(
        `Google tardó demasiado en responder para el portal ${nombrePortal}`
      );
    }

    if (status === 403) {
      throw new Error(
        "Google rechazó la solicitud. Revisa la API Key, el CX y los permisos del proyecto"
      );
    }

    if (status === 429) {
      throw new Error(
        "Se alcanzó temporalmente el límite de consultas de Google"
      );
    }

    throw new Error(
      `No fue posible buscar resultados en ${nombrePortal}: ${
        typeof detalle === "string" ? detalle : "error desconocido"
      }`
    );
  }
}

module.exports = {
  buscarEnGoogleProvider,
  construirQuery
};