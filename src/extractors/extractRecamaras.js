function extraerRecamaras(texto = "") {
  const contenido = String(texto)
    .replace(/\s+/g, " ")
    .trim();

  const patrones = [
    /(\d+)\s*(?:rec[aá]maras?|habitaciones?|dormitorios?)/i,

    /(?:rec[aá]maras?|habitaciones?|dormitorios?)[\s:,-]{0,15}(\d+)/i
  ];

  for (const patron of patrones) {
    const coincidencia = contenido.match(patron);

    if (!coincidencia) continue;

    const cantidad = Number(coincidencia[1]);

    if (
      Number.isInteger(cantidad) &&
      cantidad >= 0 &&
      cantidad <= 30
    ) {
      return {
        valor: cantidad,
        confianza: 90,
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
  extraerRecamaras
};