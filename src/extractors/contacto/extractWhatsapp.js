function limpiarWhatsapp(valor = "") {
  const digitos = String(valor).replace(/\D/g, "");

  if (digitos.length < 10 || digitos.length > 15) {
    return null;
  }

  return digitos;
}

function extraerWhatsapp($, texto = "") {
  const selectores = [
    'a[href*="wa.me/"]',
    'a[href*="api.whatsapp.com"]',
    'a[href^="whatsapp://"]'
  ];

  for (const selector of selectores) {
    const enlace = $(selector).first();

    if (!enlace.length) continue;

    const href = enlace.attr("href") || "";

    const coincidencia =
      href.match(/wa\.me\/(\d+)/i) ||
      href.match(/[?&]phone=(\d+)/i) ||
      href.match(/whatsapp:\/\/send\?phone=(\d+)/i);

    if (!coincidencia) continue;

    const whatsapp = limpiarWhatsapp(coincidencia[1]);

    if (whatsapp) {
      return {
        valor: whatsapp,
        confianza: 100,
        fuente: "enlace_whatsapp"
      };
    }
  }

  const contenido = String(texto)
    .replace(/\s+/g, " ")
    .trim();

  const patron =
    /whatsapp[\s:,-]{0,15}(\+?\d[\d\s().-]{8,20}\d)/i;

  const match = contenido.match(patron);

  if (match) {
    const whatsapp = limpiarWhatsapp(match[1]);

    if (whatsapp) {
      return {
        valor: whatsapp,
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
  extraerWhatsapp
};