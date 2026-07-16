function limpiarTexto(texto = "") {
  return String(texto)
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarAgencia(nombre = "") {
  let resultado = String(nombre)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  resultado = resultado.replace(
    /(?:,|\s)+(?:ubicad[oa]\s+en|con\s+domicilio\s+en|direcci[oó]n|av\.?|avenida|calle|col\.?|colonia|tel[eé]fono|contacto)\b[\s\S]*$/i,
    ""
  );

  resultado = resultado
    .replace(/[.,;:\-\s]+$/g, "")
    .trim();
resultado = resultado.replace(
  /\b(?:casa|departamento|terreno|oficina|local|bodega)\s+en\s+(?:venta|renta)\b[\s\S]*$/i,
  ""
);
  return resultado || null;
}

function extraerAgencia($, texto = "") {
  const contenido = limpiarTexto(texto);

  const metaPublisher =
    $('meta[property="article:publisher"]').attr("content") ||
    $('meta[name="publisher"]').attr("content");

  if (metaPublisher) {
    return {
      valor: normalizarAgencia(metaPublisher),
      confianza: 100,
      fuente: "meta"
    };
  }

  const patrones = [
    /desarrollado\s+por\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,&'-]{3,100})/i,
    /inmobiliaria\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,&'-]{3,100})/i,
    /empresa\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,&'-]{3,100})/i
  ];

  for (const patron of patrones) {
    const match = contenido.match(patron);

    if (!match) continue;

    const agencia = normalizarAgencia(match[1]);

    if (agencia) {
      return {
        valor: agencia,
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
  extraerAgencia
};