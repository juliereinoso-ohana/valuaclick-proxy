const axios = require("axios");
const cheerio = require("cheerio");

function limpiarValor(valor = "") {
  return String(valor).trim();
}
function extraerNumero(valor = "") {
  const match = String(valor)
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : null;
}

function extraerPrecio(valor = "") {
  const numero = extraerNumero(valor);

  return {
    valor: numero,
    moneda: /USD/i.test(valor) ? "USD" : "MXN"
  };
}

function extraerWhatsapp(valor = "") {
  const match = String(valor).match(
    /(?:phone=|wa\.me\/)(\d{10,15})/i
  );

  return match ? match[1] : null;
}

function crearSlug(valor = "") {
  return limpiarValor(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function detectarOperacion(operacion = "") {
  return crearSlug(operacion) === "renta"
    ? "for-rent"
    : "for-sale";
}

function detectarTipo(tipo = "") {
  const tipos = {
    casa: "casa",
    departamento: "departamento",
    terreno: "terreno",
    oficina: "oficina",
    local: "local",
    bodega: "bodega"
  };

  return tipos[crearSlug(tipo)] || "casa";
}

/**
 * Construye una URL de búsqueda directa de Lamudi.
 *
 * Ejemplo:
 * https://www.lamudi.com.mx/veracruz-llave/boca-del-rio/casa/for-sale/
 */
function construirUrlLamudi(datos = {}) {
  const estado = crearSlug(datos.estado);
  const ciudad = crearSlug(datos.ciudad);
  const tipo = detectarTipo(datos.tipo);
  const operacion = detectarOperacion(datos.operacion);

  if (!estado || !ciudad) {
    throw new Error(
      "Lamudi requiere estado y ciudad para construir la búsqueda"
    );
  }

  return `https://www.lamudi.com.mx/${estado}/${ciudad}/${tipo}/${operacion}/`;
}

function normalizarUrl(href = "") {
  if (!href) return null;

  try {
    return new URL(href, "https://www.lamudi.com.mx").href;
  } catch {
    return null;
  }
}

function esUrlUtilLamudi(url = "") {
  return (
    url.includes("lamudi.com.mx") &&
    url.includes("/detalle/")
  );
}

async function buscarEnLamudiProvider(datos = {}) {
  const urlBusqueda = construirUrlLamudi(datos);

  console.log("========== LAMUDI PROVIDER ==========");
  console.log("URL búsqueda:", urlBusqueda);
  console.log("=====================================");

  const response = await axios.get(urlBusqueda, {
    timeout: 30000,
    maxRedirects: 5,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36",
        Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9"
    }
});

const fs = require("fs");

fs.writeFileSync("lamudi.html", response.data);

console.log("HTML guardado en lamudi.html");

console.log("STATUS HTTP:", response.status);
console.log(
    "URL FINAL:",
    response.request?.res?.responseUrl || urlBusqueda
);
console.log(
    "TAMAÑO HTML:",
    response.data?.length || 0
);

const $ = cheerio.load(response.data);
  const enlaces = new Map();
  $('a[href^="/detalle/"]').each((_, elemento) => {
    const href = $(elemento).attr("href");
    const url = normalizarUrl(href);

    if (!url) return;

    const tarjeta = $(elemento).closest(
      '[data-test="normal-listing"]'
    );

    const titulo = limpiarValor(
      tarjeta
        .find(".snippet__content__title")
        .attr("content") ||
      tarjeta
        .find(".snippet__content__title")
        .text() ||
      $(elemento).attr("title") ||
      $(elemento).text()
    );

    const ubicacion = limpiarValor(
      tarjeta
        .find('[data-test="snippet-content-location"]')
        .text()
    );

    const precio = limpiarValor(
      tarjeta
        .find(".snippet__content__price")
        .text()
    );

    const recamaras = limpiarValor(
      tarjeta
        .find('[data-test="bedrooms-value"]')
        .text()
    );

    const banos = limpiarValor(
      tarjeta
        .find('[data-test="full-bathrooms-value"]')
        .text()
    );

    const construccion = limpiarValor(
      tarjeta
        .find('[data-test="area-value"]')
        .text()
    );
    const terreno = limpiarValor(
      tarjeta
        .find('[data-test="land-size-value"]')
        .text()
    );

    const antiguedad = limpiarValor(
      tarjeta
        .find('[data-test="property-age-value"]')
        .text()
    );

    const fechaPublicacion = limpiarValor(
      tarjeta
        .find('[data-test="listing-date"]')
        .text()
    );

    const telefono = limpiarValor(
       tarjeta
        .find('[data-test="agency-phone"]')
        .text()
  );

    const estacionamientos = limpiarValor(
      tarjeta
        .find(".property__number.car_park")
        .text()
    );

    const agencia = limpiarValor(
      tarjeta
        .find('[data-test="agency-name"]')
        .text() ||
      tarjeta
        .find(".agency__text__name")
        .text()
    );

    const imagen =
      tarjeta.find("img").first().attr("src") || null;

    const whatsapp = limpiarValor(
      tarjeta
        .find(
          '[data-test="snippet-whatsapp-button-in-content"]'
        )
        .attr("value")
    );
    const precioNormalizado = extraerPrecio(precio);
    const whatsappNormalizado = extraerWhatsapp(whatsapp);

        if (!enlaces.has(url)) {
      enlaces.set(url, {
        titulo: titulo || "Publicación en Lamudi",
        ubicacion: ubicacion || null,

        precio: precioNormalizado.valor,
        moneda: precioNormalizado.moneda,

        recamaras: extraerNumero(recamaras),
        banos: extraerNumero(banos),
        construccion_m2: extraerNumero(construccion),
        terreno_m2: extraerNumero(terreno),

        recamaras: extraerNumero(recamaras),
        banos: extraerNumero(banos),

        estacionamientos: extraerNumero(estacionamientos),

        antiguedad: antiguedad || null,
        fecha_publicacion: fechaPublicacion || null,

        contacto_agencia: agencia || null,
        contacto_telefono: telefono || null,
        contacto_whatsapp: whatsappNormalizado,

        imagen: imagen || null,

        portal: "Lamudi",
        dominio_portal: "lamudi.com.mx",
        url_fuente: url,
        fuente_busqueda: "lamudi_directo"
      });
    }
  });

  const resultados = [];

for (const inmueble of Array.from(enlaces.values()).slice(0, 10)) {
  try {
    const detalle = await axios.get(inmueble.url_fuente, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9"
      }
    });

const $$ = cheerio.load(detalle.data);

/* Guardamos el primer detalle para poder revisarlo */
if (resultados.length === 0) {
  fs.writeFileSync(
    "lamudi-detalle.html",
    detalle.data
  );

  console.log(
    "HTML del primer detalle guardado en lamudi-detalle.html"
  );
}

/* Buscar información estructurada JSON-LD */
const datosJsonLd = [];

$$('script[type="application/ld+json"]').each(
  (_, elemento) => {
    const contenido = $$(elemento).html();

    if (!contenido) return;

    try {
      const json = JSON.parse(contenido);

      if (Array.isArray(json)) {
        datosJsonLd.push(...json);
      } else if (json["@graph"]) {
        datosJsonLd.push(...json["@graph"]);
      } else {
        datosJsonLd.push(json);
      }
    } catch {
      // Algunos scripts no contienen JSON válido
    }
  }
);

const objetoPropiedad = datosJsonLd.find((objeto) => {
  const tipo = String(objeto?.["@type"] || "").toLowerCase();

  return (
    tipo.includes("product") ||
    tipo.includes("house") ||
    tipo.includes("residence") ||
    tipo.includes("apartment") ||
    tipo.includes("realestate")
  );
}) || {};

const buscarDatoPorTexto = (etiquetas = []) => {
  let valor = null;

  $$("li, div, span, p").each((_, elemento) => {
    if (valor) return;

    const texto = limpiarValor(
      $$(elemento).text()
    );

    const textoNormalizado = texto.toLowerCase();

    const coincide = etiquetas.some((etiqueta) =>
      textoNormalizado.includes(etiqueta)
    );

    if (coincide) {
      valor = texto;
    }
  });

  return valor;
};

const terrenoTexto = buscarDatoPorTexto([
  "terreno",
  "superficie total",
  "área de terreno",
  "area de terreno"
]);

const antiguedadTexto = buscarDatoPorTexto([
  "antigüedad",
  "antiguedad",
  "años de antigüedad",
  "anos de antiguedad"
]);

const fechaTexto = buscarDatoPorTexto([
  "publicado",
  "fecha de publicación",
  "fecha de publicacion"
]);

const telefonoTexto = buscarDatoPorTexto([
  "teléfono",
  "telefono"
]);

inmueble.terreno_m2 =
  inmueble.terreno_m2 ??
  extraerNumero(
    objetoPropiedad?.floorSize?.value ||
    objetoPropiedad?.landSize?.value ||
    objetoPropiedad?.additionalProperty?.find?.(
      (dato) =>
        /terreno|superficie total/i.test(
          dato?.name || ""
        )
    )?.value ||
    terrenoTexto
  );

inmueble.antiguedad =
  inmueble.antiguedad ??
  (
    objetoPropiedad?.yearBuilt ||
    antiguedadTexto ||
    null
  );

inmueble.fecha_publicacion =
  inmueble.fecha_publicacion ??
  (
    objetoPropiedad?.datePosted ||
    objetoPropiedad?.datePublished ||
    objetoPropiedad?.uploadDate ||
    fechaTexto ||
    null
  );

inmueble.contacto_telefono =
  inmueble.contacto_telefono ??
  (
    objetoPropiedad?.telephone ||
    objetoPropiedad?.seller?.telephone ||
    objetoPropiedad?.offers?.seller?.telephone ||
    telefonoTexto ||
    null
  );

inmueble.contacto_whatsapp =
  inmueble.contacto_whatsapp ??
  extraerWhatsapp(detalle.data);

  } catch (error) {
    console.log(
      "Detalle no disponible:",
      inmueble.url_fuente,
      error.message
    );
  }

  resultados.push(inmueble);
}

console.log(
  "Enlaces Lamudi encontrados:",
  resultados.length
);

return resultados;
}

module.exports = {
  buscarEnLamudiProvider,
  construirUrlLamudi
};