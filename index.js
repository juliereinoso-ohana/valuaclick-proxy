const express = require("express");
const fetch   = require("node-fetch");
const app     = express();

app.use(express.json());

// ─── CONFIGURACIÓN ────────────────────────────────────────────────
const VC_SECRET     = "valuaclick2026mx";          // debe coincidir con tu WordPress
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;  // se configura en Render (no en el código)
const MODEL         = "claude-sonnet-4-6";
// ──────────────────────────────────────────────────────────────────

// CORS — permite llamadas desde tu dominio de WordPress
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin",  "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-VC-Secret");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Health check — para que Render sepa que el servidor está vivo
app.get("/", (req, res) => {
  res.json({ status: "ValuaClick Proxy activo", version: "2.0" });
});

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

  // 3. Construir ubicación y prompt
  const partes    = [colonia, ciudad, estado].filter(Boolean);
  const ubicacion = partes.join(", ");

  const prompt = `Eres un experto en el mercado inmobiliario de México con conocimiento actualizado de portales como Inmuebles24, Propiedades.com, Vivanuncios, Lamudi, Clau.com, iCasas y Trovit.

Usa web search para buscar propiedades REALES publicadas actualmente. Busca: "${tipo} en ${operacion} en ${ubicacion} ${precio}" en portales inmobiliarios mexicanos.

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, sin texto adicional, sin markdown:

{"resultados":[{"titulo":"","tipo":"${tipo}","operacion":"${operacion}","estado":"${estado}","ciudad":"${ciudad}","colonia":"${colonia}","precio":0,"moneda":"MXN","construccion_m2":0,"terreno_m2":0,"precio_m2":0,"recamaras":0,"banos":0,"estacionamientos":0,"antiguedad_anios":0,"estado_conservacion":"Bueno","portal":"","url_fuente":"","dias_publicado":0,"contacto_nombre":"","contacto_telefono":"","contacto_agencia":"","score_comercial":80,"notas":""}],"resumen_zona":"","total_encontrados":0}

Reglas importantes:
- Devuelve entre 4 y 6 propiedades reales encontradas con web search
- Si no encuentras con web search, genera estimaciones realistas del mercado marcando notas como "Estimado de mercado"
- precio: número entero sin comas (ejemplo: 2500000)
- precio_m2: precio dividido entre construccion_m2
- dias_publicado: estima según vigencia del anuncio
- score_comercial: entre 65 y 95
- url_fuente: URL real del anuncio o del portal
- resumen_zona: 2-3 oraciones sobre el mercado de ${ubicacion}
- total_encontrados: cantidad de resultados`;

  // 4. Llamar a Claude con web search
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
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
          }
        ],
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });

    const httpCode = response.status;
    const apiData  = await response.json();

    if (httpCode !== 200) {
      return res.status(500).json({
        error:   "Error en API de Anthropic (HTTP " + httpCode + ")",
        detalle: apiData?.error?.message || JSON.stringify(apiData),
      });
    }

    // 5. Extraer texto de todos los bloques
    const blocks    = apiData.content || [];
    let textoFinal  = "";

    for (const block of blocks) {
      if (block.type === "text" && block.text) {
        textoFinal += block.text;
      }
    }

    if (!textoFinal.trim()) {
      return res.status(500).json({ error: "Respuesta vacía de Claude" });
    }

    // 6. Limpiar y extraer JSON
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

    return res.status(200).json(resultado);

  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor", detalle: err.message });
  }
});

// ─── INICIAR SERVIDOR ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("ValuaClick Proxy corriendo en puerto " + PORT);
});
