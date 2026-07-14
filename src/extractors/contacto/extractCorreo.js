function limpiarCorreo(valor = "") {
  const correo = String(valor)
    .trim()
    .toLowerCase();

  const patron =
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

  return patron.test(correo)
    ? correo
    : null;
}

function extraerCorreo($, texto = "") {
  const enlaceCorreo = $('a[href^="mailto:"]');

  if (enlaceCorreo.length > 0) {
    const href =
      enlaceCorreo.first().attr("href") || "";

    const correo = limpiarCorreo(
      href
        .replace(/^mailto:/i, "")
        .split("?")[0]
    );

    if (correo) {
      return {
        valor: correo,
        confianza: 100,
        fuente: "enlace_mailto"
      };
    }
  }

  const contenido = String(texto)
    .replace(/\s+/g, " ")
    .trim();

  const coincidencia = contenido.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );

  if (coincidencia) {
    const correo =
      limpiarCorreo(coincidencia[0]);

    if (correo) {
      return {
        valor: correo,
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
  extraerCorreo
};