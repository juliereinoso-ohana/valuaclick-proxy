const {
  extraerWhatsapp
} = require("./contacto/extractWhatsapp");

const {
  extraerCorreo
} = require("./contacto/extractCorreo");

const {
  extraerTelefono
} = require("./contacto/extractTelefono");

const {
  extraerAsesor
} = require("./contacto/extractAsesor");

const {
    extraerAgencia
} = require("./contacto/extractAgencia");

const {
  extraerFechaPublicacion
} = require("./extractFecha");

const {
    extraerAntiguedad
} = require("./extractAntiguedad");

const {
    extraerEstacionamientos
} = require("./extractEstacionamientos");

const {
  extraerBanos
} = require("./extractBanos");

const {
  extraerRecamaras
} = require("./extractRecamaras");

const {
  extraerTerreno
} = require("./extractTerreno");

const {
    extraerConstruccion
} = require("./extractConstruccion");

const {
  extraerMeta
} = require("./extractMeta");

const {
  extraerPrecioDesdeTexto
} = require("./extractPrecio");

const axios = require("axios");
const cheerio = require("cheerio");


/**
 * Descarga el HTML de una publicación
 */
async function descargarHTML(url) {
  const response = await axios.get(url, {
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36"
    }
  });

console.log("STATUS HTTP:", response.status);
console.log("URL FINAL:", response.request?.res?.responseUrl || url);
console.log("CONTENT-TYPE:", response.headers["content-type"]);
console.log("TAMAÑO HTML:", String(response.data || "").length);
console.log(
  "INICIO HTML:",
  String(response.data || "").slice(0, 300)
);

  return response.data;
}

/**
 * Extrae información básica de cualquier publicación.
 * Por ahora únicamente construimos la estructura.
 */
async function extraerDatos(url) {

  const html = await descargarHTML(url);

  const $ = cheerio.load(html);
  const metaDetectada = extraerMeta($);
  const metaTitulo =
  $('meta[property="og:title"]').attr("content") ||
  $('meta[name="twitter:title"]').attr("content") ||
  null;

const metaDescripcion =
  $('meta[property="og:description"]').attr("content") ||
  $('meta[name="description"]').attr("content") ||
  null;

const metaPrecio =
  $('meta[property="product:price:amount"]').attr("content") ||
  $('meta[property="og:price:amount"]').attr("content") ||
  null;

const nextDataTexto =
  $("#__NEXT_DATA__").html() ||
  null;

console.log("META TÍTULO:", metaTitulo);
console.log("META DESCRIPCIÓN:", metaDescripcion);
console.log("META PRECIO:", metaPrecio);
console.log(
  "NEXT_DATA encontrado:",
  Boolean(nextDataTexto)
);
  const scriptsJson = [];

$('script[type="application/ld+json"]').each((i, el) => {
    scriptsJson.push($(el).html());
});
  const textoPagina = $("body").text();

  const whatsappDetectado =
  extraerWhatsapp($, textoPagina);

  const correoDetectado =
  extraerCorreo($, textoPagina);

  const telefonoDetectado =
  extraerTelefono($, textoPagina);

  const asesorDetectado =
  extraerAsesor($, textoPagina);

  const agenciaDetectada = extraerAgencia($, textoPagina);

  const fechaDetectada =
  extraerFechaPublicacion(textoPagina);

  const antiguedadDetectada =
    extraerAntiguedad(textoPagina);

  const estacionamientosDetectados =
    extraerEstacionamientos(textoPagina);

  const banosDetectados =
  extraerBanos(textoPagina);
 
  const recamarasDetectadas =
  extraerRecamaras(textoPagina);

  const terrenoDetectado =
  extraerTerreno(textoPagina);


  const construccionDetectada =
    extraerConstruccion(textoPagina);
  const precioDetectado = extraerPrecioDesdeTexto(textoPagina);
  console.log("JSON-LD encontrados:", scriptsJson.length);
  return {

    url,

    titulo: metaDetectada.titulo,
    descripcion: metaDetectada.descripcion,
    imagen_principal: metaDetectada.imagen_principal,
    url_canonica: metaDetectada.url_canonica,
    meta_confianza: metaDetectada.meta_confianza,
    meta_fuente: metaDetectada.meta_fuente,

    precio: precioDetectado.valor,
    moneda: precioDetectado.moneda,
    precio_confianza: precioDetectado.confianza,
    precio_fuente: precioDetectado.fuente,

    construccion_m2: construccionDetectada.valor,
    construccion_confianza: construccionDetectada.confianza,
    construccion_fuente: construccionDetectada.fuente,

    terreno_m2: terrenoDetectado.valor,
    terreno_confianza: terrenoDetectado.confianza,
    terreno_fuente: terrenoDetectado.fuente,

    precio_m2: null,
 
    recamaras: recamarasDetectadas.valor,
    recamaras_confianza: recamarasDetectadas.confianza,
    recamaras_fuente: recamarasDetectadas.fuente,

    banos: banosDetectados.valor,
    banos_confianza: banosDetectados.confianza,
    banos_fuente: banosDetectados.fuente,

    estacionamientos: estacionamientosDetectados.valor,
    estacionamientos_confianza: estacionamientosDetectados.confianza,
    estacionamientos_fuente: estacionamientosDetectados.fuente,

    antiguedad: antiguedadDetectada.valor,
    antiguedad_confianza: antiguedadDetectada.confianza,
    antiguedad_fuente: antiguedadDetectada.fuente,


    fecha_publicacion: fechaDetectada.valor,
    fecha_publicacion_confianza: fechaDetectada.confianza,
    fecha_publicacion_fuente: fechaDetectada.fuente,

    estado_publicacion: "Activa",

    contacto_nombre: asesorDetectado.valor,
    contacto_nombre_confianza: asesorDetectado.confianza,
    contacto_nombre_fuente: asesorDetectado.fuente,

    contacto_agencia: agenciaDetectada.valor,
    contacto_agencia_confianza: agenciaDetectada.confianza,
    contacto_agencia_fuente: agenciaDetectada.fuente,

    contacto_telefono: telefonoDetectado.valor,
    contacto_telefono_confianza: telefonoDetectado.confianza,
    contacto_telefono_fuente: telefonoDetectado.fuente,

    contacto_email: correoDetectado.valor,
    contacto_email_confianza: correoDetectado.confianza,
    contacto_email_fuente: correoDetectado.fuente,

    ccontacto_whatsapp: whatsappDetectado.valor,
    contacto_whatsapp_confianza: whatsappDetectado.confianza,
    contacto_whatsapp_fuente: whatsappDetectado.fuente,

  };

}

module.exports = {
  extraerDatos
};