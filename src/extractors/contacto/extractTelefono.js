function limpiarTelefono(valor = "") {
  const texto = String(valor).trim();

  const digitos = texto.replace(/\D/g, "");

  if (digitos.length < 10 || digitos.length > 15) {
    return null;
  }

  return digitos;
}

function extraerTelefono($, texto = "") {
  const enlacesTelefono = $('a[href^="tel:"]');

  if (enlacesTelefono.length > 0) {
    const href = enlacesTelefono.first().attr("href") || "";
    const telefono = limpiarTelefono(
      href.replace(/^tel:/i, "")
    );

    if (telefono) {
      return {
        valor: telefono,
        confianza: 100,
        fuente: "enlace_tel"
      };
    }
  }

  const contenido = String(texto)
    .replace(/\s+/g, " ")
    .trim();

  const patrones = [
    /(?:tel[eé]fono|tel\.?|celular|m[oó]vil|contacto)[\s:,-]{0,15}(\+?\d[\d\s().-]{8,20}\d)/i,
    /(\+?52[\s.-]?\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{4})/,
    /(\d{2,3}[\s.-]\d{3,4}[\s.-]\d{4})/
  ];

  for (const patron of patrones) {
    const match = contenido.match(patron);

    if (!match) continue;

    const telefono = limpiarTelefono(match[1]);

    if (telefono) {
      return {
        valor: telefono,
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
  extraerTelefono
};