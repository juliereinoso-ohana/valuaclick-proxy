const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json());

// ─── CONFIGURACIÓN ────────────────────────────────────────────────
const VC_SECRET = "valuaclick2026mx";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
// ──────────────────────────────────────────────────────────────────

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-VC-Secret");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.sendStatus(200);

  next();
});

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ValuaClick Proxy activo",
    version: "4.0 sin Anthropic"
  });
});

// ─── OBTENER PORTALES DESDE SUPABASE ─────────────────────────────
async function obtenerPortales() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/portales?activo=eq.true&select=nombre,url,fase`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      console.error("Error Supabase portales:", await response.text());
      return [];
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];

  } catch (error) {
    console.error("Error obteniendo portales:", error.message);
    return [];
  }
}

// ─── LIMPIAR TEXTO PARA GOOGLE ───────────────────────────────────
function limpiarTexto(texto) {
  return (texto || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dominioDesdeUrl(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch (error) {
    return "";
  }
}

// ─── ENDPOINT PRINCIPAL ───────────────────────────────────────────
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
  } = req.body;

  if (!estado) {
    return res.status(400).json({ error: "Estado requerido" });
  }

  try {
    const portalesDB = await obtenerPortales();

    const portalesActivos = portalesDB.length > 0
      ? portalesDB
      : [
          { nombre: "Inmuebles24", url: "https://www.inmuebles24.com", fase: 1 },
          { nombre: "Propiedades.com", url: "https://www.propiedades.com", fase: 1 },
          { nombre: "Lamudi", url: "https://www.lamudi.com.mx", fase: 1 },
          { nombre: "Vivanuncios", url: "https://www.vivanuncios.com.mx", fase: 1 }
        ];

    const ubicacion = [colonia, ciudad, estado].filter(Boolean).join(", ");

    const busquedaBase = limpiarTexto([
      tipo,
      operacion,
      colonia,
      ciudad,
      estado,
      precio
    ].filter(Boolean).join(" "));

    const resultados = portalesActivos
      .filter(portal => portal && portal.nombre)
      .map((portal, index) => {
        const dominio = dominioDesdeUrl(portal.url);

        const query = dominio
          ? `site:${dominio} ${busquedaBase}`
          : busquedaBase;

        const googleUrl =
          "https://www.google.com/search?q=" + encodeURIComponent(query);

        return {
          titulo: `Buscar en ${portal.nombre}`,
          tipo,
          operacion,
          estado,
          ciudad,
          colonia,
          precio: 0,
          moneda: "MXN",
          construccion_m2: 0,
          terreno_m2: 0,
          precio_m2: 0,
          recamaras: 0,
          banos: 0,
          estacionamientos: 0,
          antiguedad_anios: 0,
          estado_conservacion: "No aplica",
          portal: portal.nombre,
          url_fuente: googleUrl,
          dias_publicado: 0,
          contacto_nombre: "",
          contacto_telefono: "",
          contacto_agencia: "",
          score_comercial: Math.max(95 - index, 70),
          notas: `Búsqueda inteligente generada para ${portal.nombre}`
        };
      });

    return res.status(200).json({
      resultados,
      resumen_zona: `ValuaClick generó búsquedas inteligentes para ${tipo} en ${operacion} en ${ubicacion}. Abre cada portal para revisar publicaciones reales indexadas por Google.`,
      total_encontrados: resultados.length
    });

  } catch (error) {
    console.error("ERROR GENERANDO ENLACES:", error);

    return res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  }
});

// ─── INICIAR SERVIDOR ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("ValuaClick Proxy v4.0 sin Anthropic corriendo en puerto " + PORT);
});
