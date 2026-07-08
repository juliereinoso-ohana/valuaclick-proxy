require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { buscarResultados } = require("./src/services/searchService");

const app = express();

app.use(cors());
app.use(express.json());

const VC_SECRET = process.env.VC_SECRET || "valuaclick2026mx";

function limpiarTexto(txt = "") {
  return txt
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function crearLinkGoogle(portal, dominio, datos) {
  const partes = [
    datos.operacion,
    datos.tipo,
    datos.colonia,
    datos.ciudad,
    datos.estado,
    datos.precio
  ].filter(Boolean);

  const query = `site:${dominio} ${partes.join(" ")}`;

  return {
    titulo: `Buscar ${datos.tipo} en ${datos.operacion} en ${portal}`,
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
    estado_conservacion: "Consultar en publicación",
    portal,
    url_fuente: "https://www.google.com/search?q=" + encodeURIComponent(query),
    dias_publicado: 0,
    contacto_nombre: "",
    contacto_telefono: "",
    contacto_agencia: "",
    score_comercial: 80,
    notas: `Enlace inteligente generado por ValuaClick para buscar en ${portal}.`
  };
}

function generarResultadosFallback(datos) {
  const portales = [
    { nombre: "Inmuebles24", dominio: "inmuebles24.com" },
    { nombre: "Lamudi", dominio: "lamudi.com.mx" },
    { nombre: "Propiedades.com", dominio: "propiedades.com" },
    { nombre: "Vivanuncios", dominio: "vivanuncios.com.mx" },
    { nombre: "Trovit", dominio: "trovit.com.mx" },
    { nombre: "RE/MAX", dominio: "remax.com.mx" },
    { nombre: "KW México", dominio: "kwmexico.mx" },
    { nombre: "Nocnok", dominio: "nocnok.com" }
  ];

  return portales.map((p, index) => ({
    ...crearLinkGoogle(p.nombre, p.dominio, datos),
    score_comercial: Math.max(95 - index * 3, 70)
  }));
}

app.get("/", (req, res) => {
  res.json({
    status: "ValuaClick Proxy activo",
    version: "6.0 fallback inteligente"
  });
});

app.post("/buscar", async (req, res) => {
  console.log("POST /buscar recibido:", req.body);

  const secret = req.headers["x-vc-secret"];

  if (secret !== VC_SECRET) {
    return res.status(403).json({ error: "No autorizado" });
  }

  const {
    operacion = "Venta",
    tipo = "Casa",
    estado = "",
    ciudad = "",
    colonia = "",
    precio = ""
  } = req.body || {};

  if (!estado) {
    return res.status(400).json({ error: "Estado requerido" });
  }

  if (!ciudad && !colonia) {
    return res.status(400).json({ error: "Ciudad o colonia requerida" });
  }

  const datos = {
    operacion,
    tipo,
    estado,
    ciudad: ciudad.trim(),
    colonia: colonia.trim(),
    precio
  };

 let resultados = [];

try {
  resultados = await buscarResultados(datos);
} catch (error) {
  console.error("ERROR EN BUSCADOR:", error.response?.data || error.message);
  resultados = generarResultadosFallback(datos);
}

  const ubicacion = [colonia, ciudad, estado].filter(Boolean).join(", ");

  return res.status(200).json({
    resultados,
    resumen_zona: `ValuaClick generó búsquedas inteligentes en ${resultados.length} portales inmobiliarios para ${tipo} en ${operacion} en ${ubicacion}. Abre cada portal para revisar disponibilidad, precio, superficie y datos actualizados.`,
    total_encontrados: resultados.length,
    modo: "fallback_inteligente"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("ValuaClick Proxy V6 corriendo en puerto " + PORT);
});
