function limpiarTexto(txt = "") {
    return txt
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function crearLinkGoogle(portal, dominio, datos) {

    const partes = [
        datos.operacion,
        datos.tipo,
        datos.colonia,
        datos.ciudad,
        datos.estado,
        datos.precio
    ].filter(Boolean);

    const query = `site:${dominio} ${partes.join(" ")}`;

    return {

        titulo: `Buscar ${datos.tipo} en ${datos.operacion} en ${portal}`,

        tipo: datos.tipo,

        operacion: datos.operacion,

        estado: datos.estado,

        ciudad: datos.ciudad,

        colonia: datos.colonia,

        precio: 0,

        moneda: "MXN",

        construccion_m2: 0,

        terreno_m2: 0,

        precio_m2: 0,

        recamaras: 0,

        banos: 0,

        estacionamientos: 0,

        antiguedad_anios: 0,

        estado_conservacion: "Consultar en publicación",

        portal,

        url_fuente:
            "https://www.google.com/search?q=" +
            encodeURIComponent(query),

        dias_publicado: 0,

        contacto_nombre: "",

        contacto_telefono: "",

        contacto_agencia: "",

        score_comercial: 80,

        notas:
            `Enlace inteligente generado por ValuaClick para buscar en ${portal}.`

    };

}

module.exports = {
    limpiarTexto,
    crearLinkGoogle
};
