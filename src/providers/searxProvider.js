const axios = require("axios");

const SEARX_URL =
  process.env.SEARX_URL ||
  "https://valuaclick-searxng.onrender.com/search";

/**
 * Limpia valores antes de agregarlos a la consulta.
 */
function limpiarValor(valor) {
  if (valor === undefined || valor === null) {
    return "";
  }

  return String(valor).trim();
}

/**
 * Construye la búsqueda restringida al portal indicado.
 *
 * Por ahora no agregamos el precio exacto porque puede reducir
 * demasiado los resultados. Después podremos utilizarlo para
 * ordenar o filtrar las publicaciones encontradas.
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
 * Intenta obtener una fecha disponible en la respuesta de SearXNG.
 *
 * Importante:
 * SearXNG no siempre proporciona la fecha real de publicación.
 * Cuando no existe, devolvemos null y después la extraeremos
 * directamente desde la publicación.
 */
function detectarFecha(item = {}) {
  return (
    item.publishedDate ||
    item.published_date ||
    item.pubdate ||
    item.date ||
    null
  );
}

/**
 * Normaliza las URLs recibidas desde SearXNG.
 */
function obtenerUrl(item = {}) {
  return item.url || item.link || null;
}

/**
 * Busca publicaciones mediante la instancia SearXNG de ValuaClick.
 */
async function buscarEnSearXProvider(datos = {}, portal = {}) {
  if (!portal || !portal.dominio) {
    throw new Error(
      "El portal no tiene un dominio válido para realizar la búsqueda"
    );
  }

  const nombrePortal = detectarPortal(portal.nombre);
  const query = construirQuery(datos, portal.dominio);

  console.log("========== SEARX PROVIDER ==========");
  console.log("Portal:", nombrePortal);
  console.log("Dominio:", portal.dominio);
  console.log("Query:", query);
  console.log("====================================");

  try {
  const urlFinal =
    `${SEARX_URL}?q=${encodeURIComponent(query)}&format=json`;

  console.log("URL FINAL:", urlFinal);

  const response = await axios.get(urlFinal, {
    timeout: 30000
  });

  const items = Array.isArray(response.data?.results)
    ? response.data.results
    : [];

    console.log(
      `Resultados encontrados en ${nombrePortal}:`,
      items.length
    );

    return items
      .filter((item) => {
        const url = obtenerUrl(item);

        return (
          url &&
          url.includes(portal.dominio)
        );
      })
      .slice(0, 5)
      .map((item, index) => {
        const fechaPublicacion = detectarFecha(item);

        return {
          titulo:
            limpiarValor(item.title) ||
            `Resultado en ${nombrePortal}`,

          tipo: limpiarValor(datos.tipo) || null,
          operacion:
            limpiarValor(datos.operacion) || null,
          estado: limpiarValor(datos.estado) || null,
          ciudad: limpiarValor(datos.ciudad) || null,
          colonia: limpiarValor(datos.colonia) || null,

          /*
           * Estos campos todavía no deben inventarse.
           * Los extraeremos desde el texto o desde la página
           * de cada publicación en la siguiente etapa.
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
          url_fuente: obtenerUrl(item),

          fecha_publicacion: fechaPublicacion,
          fecha_actualizacion: null,
          dias_publicado: null,
          fecha_verificada: Boolean(fechaPublicacion),

          contacto_nombre: null,
          contacto_telefono: null,
          contacto_agencia: null,

          score_comercial: Math.max(
            Number(portal.score || 80) - index,
            60
          ),

          notas:
            limpiarValor(item.content) ||
            "Resultado obtenido mediante SearXNG",

          fuente_busqueda: "searxng",
          motor_origen:
            Array.isArray(item.engines) &&
            item.engines.length
              ? item.engines.join(", ")
              : item.engine || null,

          posicion_resultado: index + 1,
          score_motor:
            typeof item.score === "number"
              ? item.score
              : null
        };
      });
  } catch (error) {
    const status = error.response?.status;

    const detalle =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    console.error("=========== SEARX ERROR ===========");
    console.error("Portal:", nombrePortal);
    console.error("Código HTTP:", status || "Sin respuesta");
    console.error("Detalle:", detalle);
    
    console.error(
  "Respuesta SearX:",
  typeof error.response?.data === "string"
    ? error.response.data.slice(0, 500)
    : error.response?.data
);
    console.error("===================================");

    if (error.code === "ECONNABORTED") {
      throw new Error(
        `SearXNG tardó demasiado en responder para ${nombrePortal}`
      );
    }

    if (status === 403) {
      throw new Error(
        `SearXNG rechazó la búsqueda para ${nombrePortal}`
      );
    }

    if (status === 429) {
      throw new Error(
        "SearXNG recibió demasiadas consultas. Intenta nuevamente en unos segundos"
      );
    }

    throw new Error(
      `No fue posible buscar resultados en ${nombrePortal}: ${
        typeof detalle === "string"
          ? detalle
          : "error desconocido"
      }`
    );
  }
}

module.exports = {
  buscarEnSearXProvider,
  construirQuery
};