function normalizarNumero(texto = "") {
  const limpio = String(texto)
    .replace(/[^\d.,]/g, "")
    .replace(/,/g, "");

  const numero = Number(limpio);

  return Number.isFinite(numero) ? numero : null;
}

function detectarMoneda(texto = "") {
  const valor = String(texto).toUpperCase();

  if (valor.includes("USD") || valor.includes("US$")) {
    return "USD";
  }

  if (valor.includes("EUR") || valor.includes("€")) {
    return "EUR";
  }

  if (
    valor.includes("MXN") ||
    valor.includes("M.N.") ||
    valor.includes("$")
  ) {
    return "MXN";
  }

  return null;
}

function extraerPrecioDesdeTexto(texto = "") {
  const contenido = String(texto);

  const patrones = [
    /(?:MXN|USD|US\$|\$)\s*([\d.,]+)/i,
    /([\d.,]+)\s*(?:MXN|USD)/i
  ];

  for (const patron of patrones) {
    const coincidencia = contenido.match(patron);

    if (!coincidencia) {
      continue;
    }

    const precio = normalizarNumero(coincidencia[1]);

    if (precio && precio >= 1000) {
      return {
        valor: precio,
        moneda: detectarMoneda(coincidencia[0]),
        confianza: 70,
        fuente: "texto"
      };
    }
  }

  return {
    valor: null,
    moneda: null,
    confianza: 0,
    fuente: null
  };
}

module.exports = {
  extraerPrecioDesdeTexto
};