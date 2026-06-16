const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json());

// ─── CONFIGURACIÓN ────────────────────────────────────────────────
const VC_SECRET = "valuaclick2026mx";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;
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
    version: "5.0 Google Search API"
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

function detectarPortal(link, portales) {
  const url = (link || "").toLowerCase();

  const encontrado = portales.find(p => {
    const dominio = dominioDesdeUrl(p.url).toLowerCase();
    return dominio && url.includes(dominio);
  });

  return encontrado ? encontrado.nombre : "Portal inmobiliario";
}

// ─── BUSCAR EN GOOGLE CUSTOM SEARCH ───────────────────────────────
async function buscarEnGoogle(query) {

  console.log("GOOGLE_API_KEY:", GOOGLE_API_KEY?.substring(0,10));
  console.log("GOOGLE_CX:", GOOGLE_CX);

  const url =
    "https://www.googleapis.com/customsearch/v1?" +
    new URLSearchParams({
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CX,
      q: query,
      num: "10",
      gl: "mx",
      hl: "es"
    }).toString();

  console.log("URL GOOGLE:", url);

  const response = await fetch(url);
  const data = await response.json();

  console.log("RESPUESTA GOOGLE:", JSON.stringify(data,null,2));

  if (!response.ok) {
    throw new Error(data?.error?.message || "Error Google");
  }

  return data.items || [];
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

  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    return res.status(500).json({
      error: "Faltan variables de Google Search API"
    });
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

    const consulta = limpiarTexto([
      tipo,
      operacion,
      colonia,
      ciudad,
      estado,
      precio
    ].filter(Boolean).join(" "));

    const query = `${consulta} inmueble propiedad casa departamento terreno`;

    const googleItems = await buscarEnGoogle(query);

    const resultados = googleItems.map((item, index) => {
      const portal = detectarPortal(item.link, portalesActivos);

      return {
        titulo: item.title || "Resultado inmobiliario",
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
        estado_conservacion: "Verificar en publicación",
        portal,
        url_fuente: item.link || "#",
        dias_publicado: 0,
        contacto_nombre: "",
        contacto_telefono: "",
        contacto_agencia: "",
        score_comercial: Math.max(95 - index, 70),
        notas: item.snippet || "Resultado encontrado por Google Custom Search"
      };
    });

    return res.status(200).json({
      resultados,
      resumen_zona: `ValuaClick encontró ${resultados.length} resultados inmobiliarios relacionados con ${tipo} en ${operacion} en ${ubicacion}. Revisa cada publicación para validar precio, superficie y disponibilidad.`,
      total_encontrados: resultados.length
    });

  } catch (error) {
    console.error("ERROR GOOGLE SEARCH:", error);

    return res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  }
});

// ─── INICIAR SERVIDOR ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("ValuaClick Proxy v5.0 Google Search API corriendo en puerto " + PORT);
});
