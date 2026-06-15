const express = require("express");
const fetch   = require("node-fetch");
const app     = express();

app.use(express.json());

// ─── CONFIGURACIÓN ────────────────────────────────────────────────
const VC_SECRET     = "valuaclick2026mx";
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_KEY;
const MODEL         = "claude-sonnet-4-6";
// ──────────────────────────────────────────────────────────────────

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin",  "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-VC-Secret");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ValuaClick Proxy activo", version: "3.0" });
});

// ─── OBTENER PORTALES DESDE SUPABASE ─────────────────────────────
async function obtenerPortales() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/portales?activo=eq.true&select=nombre,url`, {
      headers: {
        "apikey":        SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type":  "application/json",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : null;

  } catch (e) {
    console.error("Error obteniendo portales:", e.message);
    return null;
  }
}

// ─── ENDPOINT PRINCIPAL ───────────────────────────────────────────
app.post("/buscar", async (req, res) => {

  // 1. Verificar clave secreta
  const secret = req.headers["x-vc-secret"];
  if (secret !== VC_SECRET) {
    return res.status(403).json({ error: "No autorizado" });
  }

  // 2. Leer parámetros
  const { operacion = "Venta", tipo = "Casa", estado = "", ciudad = "", colonia = "", precio = "" } = req.body;

  if (!estado) {
    return res.status(400).json({ error: "Estado requerido" });
  }

  // 3. Obtener portales desde Supabase
  const portalesDB = await obtenerPortales();

  let listaPortales = "";
  let sitesGoogle   = "";

  if (portalesDB && portalesDB.length > 0) {
    listaPortales = portalesDB.map(p => `- ${p.nombre}${p.url ? " (" + p.url + ")" : ""}`).join("\n");
    sitesGoogle   = portalesDB
      .filter(p => p.url)
      .map(p => {
        try {
          return "site:" + new URL(p.url).hostname;
        } catch(e) {
          return "";
        }
      })
      .filter(Boolean)
      .slice(0, 8)
      .join(" OR ");
  } else {
    listaPortales = "- Inmuebles24\n- Propiedades.com\n- Vivanuncios\n- Lamudi\n- Clau.com\n- iCasas\n- Trovit\n- Century21";
    sitesGoogle   = "site:inmuebles24.com OR site:propiedades.com OR site:vivanuncios.com.mx OR site:lamudi.com.mx OR site:clau.com";
  }

  // 4. Construir ubicación y prompt
  const partes    = [colonia, ciudad, estado].filter(Boolean);
  const ubicacion = partes.join(", ");

  const prompt = `Eres un experto en el mercado inmobiliario de México con acceso a múltiples portales inmobiliarios.

El usuario busca: ${tipo} en ${operacion} en ${ubicacion}. Rango de precio: ${precio}.

Usa web search para buscar propiedades REALES publicadas actualmente. 
Busca con esta consulta: "${tipo} en ${operacion} ${ubicacion} ${precio} ${sitesGoogle}"

Los portales registrados en nuestra plataforma son:
${listaPortales}

Prioriza resultados de estos portales. Si encuentras contactos reales (teléfono, nombre, agencia) inclúyelos. Si no los encuentras, deja esos campos vacíos — NO inventes datos de contacto.

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, sin texto adicional, sin markdown:

{"resultados":[{"titulo":"","tipo":"${tipo}","operacion":"${operacion}","estado":"${estado}","ciudad":"${ciudad}","colonia":"","precio":0,"moneda":"MXN","construccion_m2":0,"terreno_m2":0,"precio_m2":0,"recamaras":0,"banos":0,"estacionamientos":0,"antiguedad_anios":0,"estado_conservacion":"Bueno","portal":"","url_fuente":"","dias_publicado":0,"contacto_nombre":"","contacto_telefono":"","contacto_agencia":"","score_comercial":80,"notas":""}],"resumen_zona":"","total_encontrados":0}

Reglas importantes:
- Devuelve entre 4 y 6 propiedades
- precio: número entero sin comas (ejemplo: 2500000)
- precio_m2: precio dividido entre construccion_m2
- url_fuente: URL real del anuncio, no inventes
- contacto_nombre, contacto_telefono, contacto_agencia: solo si los encontraste realmente, si no deja ""
- dias_publicado: estima según vigencia del anuncio
- score_comercial: entre 65 y 95
- estado_conservacion: "Excelente", "Bueno", "Regular" o "A remodelar"
- resumen_zona: 2-3 oraciones sobre el mercado de ${ubicacion} para ${tipo} en ${operacion}
- total_encontrados: cantidad de resultados en el array
- notas: si es dato estimado escribe "Estimado de mercado", si es real déjalo vacío`;

  // 5. Llamar a Claude con web search
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 4000,
         messages: [
    { role: "user", content: prompt }
  ],
}),
    const httpCode = response.status;
    const apiData  = await response.json();

    if (httpCode !== 200) {
      return res.status(500).json({
        error:   "Error en API de Anthropic (HTTP " + httpCode + ")",
        detalle: apiData?.error?.message || JSON.stringify(apiData),
      });
    }

    // 6. Extraer texto de todos los bloques
    const blocks   = apiData.content || [];
    let textoFinal = "";

    for (const block of blocks) {
      if (block.type === "text" && block.text) {
        textoFinal += block.text;
      }
    }

    if (!textoFinal.trim()) {
      return res.status(500).json({ error: "Respuesta vacía de Claude" });
    }

    // 7. Limpiar y extraer JSON
    let limpio = textoFinal.trim();
    limpio = limpio.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    const inicio = limpio.indexOf("{");
    const fin    = limpio.lastIndexOf("}");

    if (inicio === -1 || fin === -1) {
      return res.status(500).json({ error: "No se encontró JSON en la respuesta", raw: limpio.slice(0, 300) });
    }

    const jsonPuro  = limpio.slice(inicio, fin + 1);
    const resultado = JSON.parse(jsonPuro);

    if (!resultado.resultados || !Array.isArray(resultado.resultados)) {
      return res.status(500).json({ error: "Estructura de respuesta incorrecta" });
    }

    // 8. Limpiar contactos — quitar campos con datos sospechosamente genéricos
    resultado.resultados = resultado.resultados.map(p => {
      const nombresGenéricos = ["agente", "asesor", "vendedor", "contacto", "inmobiliaria", "no disponible"];
      const esGenérico = (val) => !val || nombresGenéricos.some(g => val.toLowerCase().includes(g));

      return {
        ...p,
        contacto_nombre:   esGenérico(p.contacto_nombre)   ? "" : p.contacto_nombre,
        contacto_telefono: esGenérico(p.contacto_telefono) ? "" : p.contacto_telefono,
        contacto_agencia:  esGenérico(p.contacto_agencia)  ? "" : p.contacto_agencia,
      };
    });

    return res.status(200).json(resultado);

  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor", detalle: err.message });
  }
});

// ─── INICIAR SERVIDOR ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("ValuaClick Proxy v3.0 corriendo en puerto " + PORT);
});
