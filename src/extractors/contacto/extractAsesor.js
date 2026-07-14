function limpiarTexto(texto = "") {
  return String(texto)
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarAsesor(nombre = "") {
  const resultado = limpiarTexto(nombre)
    .replace(
      /(?:,|\s)+(?:tel[eé]fono|celular|whatsapp|correo|email|contacto|inmobiliaria|agencia)\b[\s\S]*$/i,
      ""
    )
    .replace(/[.,;:\-\s]+$/g, "")
    .trim();

  return resultado || null;
}

function extraerAsesor($, texto = "") {
  const contenido = limpiarTexto(texto);

  const metaAutor =
    $('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content");

  if (metaAutor) {
    return {
      valor: normalizarAsesor(metaAutor),
      confianza: 100,
      fuente: "meta"
    };
  }

  const patrones = [
    /asesor(?:a)?\s+(?:inmobiliari[oa]\s+)?[\s:,-]{0,10}([A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]{3,80})/i,
    /agente\s+(?:inmobiliari[oa]\s+)?[\s:,-]{0,10}([A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]{3,80})/i,
    /contactar\s+(?:con|a)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]{3,80})/i,
    /contacto[\s:,-]{0,10}([A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]{3,80})/i
  ];

  for (const patron of patrones) {
    const match = contenido.match(patron);

    if (!match) continue;

    const asesor = normalizarAsesor(match[1]);

    if (asesor) {
      return {
        valor: asesor,
        confianza: 85,
        fuente: "texto"
      };
    }
  }

  return {
    valor: null,
    confianza: 0,
    fuente: null
  };
}

module.exports = {
  extraerAsesor
};