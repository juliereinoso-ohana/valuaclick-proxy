const {
  extraerAgencia
} = require("./extractAgencia");

const {
  extraerAsesor
} = require("./extractAsesor");

const {
  extraerTelefono
} = require("./extractTelefono");

const {
  extraerCorreo
} = require("./extractCorreo");

const {
  extraerWhatsapp
} = require("./extractWhatsapp");

function extraerContacto($, texto = "") {
  const agencia = extraerAgencia($, texto);
  const asesor = extraerAsesor($, texto);
  const telefono = extraerTelefono($, texto);
  const correo = extraerCorreo($, texto);
  const whatsapp = extraerWhatsapp($, texto);

  return {
    contacto_agencia: agencia.valor,
    contacto_agencia_confianza: agencia.confianza,
    contacto_agencia_fuente: agencia.fuente,

    contacto_nombre: asesor.valor,
    contacto_nombre_confianza: asesor.confianza,
    contacto_nombre_fuente: asesor.fuente,

    contacto_telefono: telefono.valor,
    contacto_telefono_confianza: telefono.confianza,
    contacto_telefono_fuente: telefono.fuente,

    contacto_email: correo.valor,
    contacto_email_confianza: correo.confianza,
    contacto_email_fuente: correo.fuente,

    contacto_whatsapp: whatsapp.valor,
    contacto_whatsapp_confianza: whatsapp.confianza,
    contacto_whatsapp_fuente: whatsapp.fuente
  };
}

module.exports = {
  extraerContacto
};