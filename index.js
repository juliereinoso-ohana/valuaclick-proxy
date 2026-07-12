// DEPLOY FIX 2026-07-12

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
  buscarResultados,
  PORTALES
} = require("./src/services/searchService");

const app = express();

const ORIGENES_PERMITIDOS = [
  "https://valuaclick.mx",
  "https://www.valuaclick.mx",
  "http://localhost:5173"
];

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Permite solicitudes sin origin, por ejemplo:
       * Postman, Render health checks o llamadas internas.
       */
      if (!origin || ORIGENES_PERMITIDOS.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origen no permitido por CORS: ${origin}`)
      );
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "X-VC-Secret"
    ]
  })
);

app.use(
  express.json({
    limit: "100kb"
  })
);

const VC_SECRET = process.env.VC_SECRET;

if (!VC_SECRET) {
  console.error(
    "ERROR: Falta configurar VC_SECRET en las variables de entorno"
  );
}

/**
 * Limpia valores recibidos desde el frontend.
 */
function limpiarTexto(valor = "") {
  return String(valor)
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Construye un enlace de búsqueda manual en Google.
 * Solo se utiliza cuando Google Custom Search falla completamente.
 */
function crearLinkGoogle(portal, dominio, datos) {
  const partes = [
    datos.operacion,
    datos.tipo,
    datos.colonia,
    datos.ciudad,
    datos.estado
  ].filter(Boolean);

  const query = [
    `site:${dominio}`,
    ...partes,
    "inmueble OR propiedad"
  ].join(" ");

  return {
    titulo: `Buscar ${datos.tipo} en ${datos.operacion} en ${portal}`,

    tipo: datos.tipo || null,
    operacion: datos.operacion || null,
    estado: datos.estado || null,
    ciudad: datos.ciudad || null,
    colonia: datos.colonia || null,

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

    portal,
    dominio_portal: dominio,

    url_fuente:
      "https://www.google.com/search?q=" +
      encodeURIComponent(query),

    dias_publicado: null,
    contacto_nombre: null,
    contacto_telefono: null,
    contacto_agencia: null,

    score_comercial: 70,

    notas:
      `Enlace de búsqueda generado por ValuaClick para consultar publicaciones disponibles en ${portal}.`,

    fuente_busqueda: "google_fallback",
    posicion_resultado: null
  };
}

/**
 * Genera enlaces manuales cuando no fue posible obtener
 * resultados mediante Google Custom Search.
 */
function generarResultadosFallback(datos) {
  return PORTALES.map((portal, index) => ({
    ...crearLinkGoogle(
      portal.nombre,
      portal.dominio,
      datos
    ),
    score_comercial: Math.max(
      Number(portal.score || 80) - index,
      60
    )
  }));
}

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ValuaClick Proxy activo",
    version: "7.0",
    servicio: "Buscador de comparables inmobiliarios",
    timestamp: new Date().toISOString()
  });
});

app.post("/buscar", async (req, res) => {
  const inicio = Date.now();

  console.log("====================================");
  console.log("POST /buscar recibido");
  console.log("====================================");

  if (!VC_SECRET) {
    return res.status(500).json({
      error: "El servidor no está configurado correctamente"
    });
  }

  const secret = req.headers["x-vc-secret"];

  if (!secret || secret !== VC_SECRET) {
    return res.status(403).json({
      error: "No autorizado"
    });
  }

  const cuerpo = req.body || {};

  const datos = {
    operacion: limpiarTexto(
      cuerpo.operacion || "Venta"
    ),
    tipo: limpiarTexto(
      cuerpo.tipo || "Casa"
    ),
    estado: limpiarTexto(
      cuerpo.estado || ""
    ),
    ciudad: limpiarTexto(
      cuerpo.ciudad || ""
    ),
    colonia: limpiarTexto(
      cuerpo.colonia || ""
    ),
    precio: limpiarTexto(
      cuerpo.precio || ""
    )
  };

  if (!datos.estado) {
    return res.status(400).json({
      error: "Estado requerido"
    });
  }

  if (!datos.ciudad && !datos.colonia) {
    return res.status(400).json({
      error: "Ciudad o colonia requerida"
    });
  }

  try {
    const respuestaBusqueda =
      await buscarResultados(datos);

    const resultados =
      respuestaBusqueda.resultados || [];

    const resumenBusqueda =
      respuestaBusqueda.resumen || {};

    /*
     * Si Google respondió correctamente, pero no encontró
     * publicaciones, generamos enlaces manuales para que
     * el usuario todavía pueda continuar la investigación.
     */
    if (resultados.length === 0) {
      const fallback =
        generarResultadosFallback(datos);

      const ubicacion = [
        datos.colonia,
        datos.ciudad,
        datos.estado
      ]
        .filter(Boolean)
        .join(", ");

      return res.status(200).json({
        resultados: fallback,

        resumen_zona:
          `No se encontraron publicaciones directas mediante Google Custom Search. ValuaClick generó enlaces de búsqueda para ${datos.tipo} en ${datos.operacion} en ${ubicacion}.`,

        total_encontrados: fallback.length,

        resumen_busqueda: {
          ...resumenBusqueda,
          total_resultados: fallback.length
        },

        modo: "fallback_inteligente",
        duracion_ms: Date.now() - inicio
      });
    }

    const ubicacion = [
      datos.colonia,
      datos.ciudad,
      datos.estado
    ]
      .filter(Boolean)
      .join(", ");

    return res.status(200).json({
      resultados,

      resumen_zona:
        `ValuaClick encontró ${resultados.length} publicaciones relacionadas con ${datos.tipo} en ${datos.operacion} en ${ubicacion}. Verifica precio, superficie y disponibilidad directamente en cada publicación.`,

      total_encontrados: resultados.length,
      resumen_busqueda: resumenBusqueda,

      modo: "google_custom_search",
      duracion_ms: Date.now() - inicio
    });
  } catch (error) {
    console.error("=========== ERROR /BUSCAR ===========");
    console.error(error.message);
    console.error("======================================");

    const resultadosFallback =
      generarResultadosFallback(datos);

    const ubicacion = [
      datos.colonia,
      datos.ciudad,
      datos.estado
    ]
      .filter(Boolean)
      .join(", ");

    return res.status(200).json({
      resultados: resultadosFallback,

      resumen_zona:
        `La búsqueda automática no estuvo disponible. ValuaClick generó enlaces alternativos para buscar ${datos.tipo} en ${datos.operacion} en ${ubicacion}.`,

      total_encontrados:
        resultadosFallback.length,

      resumen_busqueda: {
        total_resultados:
          resultadosFallback.length,
        portales_consultados:
          PORTALES.length,
        portales_exitosos: 0,
        portales_con_error: [
          {
            portal: "Google Custom Search",
            error: error.message
          }
        ]
      },

      modo: "fallback_inteligente",
      duracion_ms: Date.now() - inicio
    });
  }
});

/**
 * Manejo de errores generales, incluyendo CORS.
 */
app.use((error, req, res, next) => {
  console.error("Error general:", error.message);

  return res.status(500).json({
    error: "Ocurrió un error interno en el servidor"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `ValuaClick Proxy V7 corriendo en puerto ${PORT}`
  );
});