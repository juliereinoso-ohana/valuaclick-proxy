const axios = require("axios");

function construirQuery(datos, dominio) {
  const partes = [
    `site:${dominio}`,
    datos.operacion,
    datos.tipo,
    datos.colonia,
    datos.ciudad,
    datos.estado,
    datos.precio,
    "inmueble",
    "propiedad"
  ].filter(Boolean);

  return partes.join(" ");
}

function detectarPortal(nombrePortal) {
  return nombrePortal || "Portal inmobiliario";
}

async function buscarEnGoogleProvider(datos, portal) {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_CX = process.env.GOOGLE_CX;

  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    throw new Error("Faltan GOOGLE_API_KEY o GOOGLE_CX en variables de entorno");
  }

  const query = construirQuery(datos, portal.dominio);

  const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
    params: {
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CX,
      q: query,
      num: 5,
      gl: "mx",
      hl: "es"
    }
  });

  const items = response.data.items || [];

  return items.map((item, index) => ({
    titulo: item.title || `Resultado en ${portal.nombre}`,
    tipo: datos.tipo,
    operacion: datos.operacion,
    estado: datos.estado,
    ciudad: datos.ciudad,
    colonia: datos.colonia,
    precio: 0,
    moneda: "MXN",
    construccion_m2: 0,
    terreno_m2: 0,
    precio_m2: 0,
    recamaras: 0,
    banos: 0,
    estacionamientos: 0,
    antiguedad_anios: 0,
    estado_conservacion: "Verificar en publicación",
    portal: detectarPortal(portal.nombre),
    url_fuente: item.link || "#",
    dias_publicado: 0,
    contacto_nombre: "",
    contacto_telefono: "",
    contacto_agencia: "",
    score_comercial: Math.max((portal.score || 80) - index, 60),
    notas: item.snippet || "Resultado obtenido desde Google Custom Search API"
  }));
}

module.exports = {
  buscarEnGoogleProvider
};