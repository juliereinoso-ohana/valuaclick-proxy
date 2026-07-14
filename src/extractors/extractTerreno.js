function limpiarNumero(valor) {
  if (!valor) return null;

  const numero = Number(
    String(valor)
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "")
  );

  return Number.isFinite(numero) ? numero : null;
}

function extraerTerreno(texto = "") {
  const contenido = String(texto)
    .replace(/\s+/g, " ")
    .trim();

  const patrones = [
    /terreno(?:s)?(?:\s+residencial(?:es)?)?\s+de\s+(\d+(?:[.,]\d+)?)\s*(?:m²|m2)/i,

    /superficie\s+de\s+terreno[\s:,-]{0,15}(\d+(?:[.,]\d+)?)\s*(?:m²|m2)/i,

    /terreno[\s:,-]{0,15}(\d+(?:[.,]\d+)?)\s*(?:m²|m2)/i,

    /(\d+(?:[.,]\d+)?)\s*(?:m²|m2)\s+de\s+terreno/i
  ];

  for (const patron of patrones) {
    const coincidencia = contenido.match(patron);

    if (!coincidencia) continue;

    const metros = limpiarNumero(coincidencia[1]);

    if (metros && metros >= 20 && metros <= 100000) {
      return {
        valor: metros,
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
  extraerTerreno
};