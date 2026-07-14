function obtenerMeta($, selector) {
  const valor = $(selector).attr("content");

  return valor ? String(valor).trim() : null;
}

function extraerMeta($) {
  const titulo =
    obtenerMeta($, 'meta[property="og:title"]') ||
    obtenerMeta($, 'meta[name="twitter:title"]') ||
    $("title").text().trim() ||
    null;

  const descripcion =
    obtenerMeta($, 'meta[property="og:description"]') ||
    obtenerMeta($, 'meta[name="description"]') ||
    obtenerMeta($, 'meta[name="twitter:description"]') ||
    null;

  const imagen =
    obtenerMeta($, 'meta[property="og:image"]') ||
    obtenerMeta($, 'meta[name="twitter:image"]') ||
    null;

  const urlCanonica =
    $('link[rel="canonical"]').attr("href") ||
    obtenerMeta($, 'meta[property="og:url"]') ||
    null;

  return {
    titulo,
    descripcion,
    imagen_principal: imagen,
    url_canonica: urlCanonica,
    meta_confianza: titulo || descripcion ? 90 : 0,
    meta_fuente: titulo || descripcion ? "meta_tags" : null
  };
}

module.exports = {
  extraerMeta
};
