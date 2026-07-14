function extraerBanos(texto = "") {

    const contenido = String(texto)
        .replace(/\s+/g, " ")
        .trim();

    const patrones = [

        /(\d+(?:\.\d+)?)\s*bañ(?:o|os)/i,

        /(\d+(?:\.\d+)?)\s*baths?/i,

        /bañ(?:o|os)[\s:,-]{0,15}(\d+(?:\.\d+)?)/i

    ];

    for (const patron of patrones) {

        const match = contenido.match(patron);

        if (!match) continue;

        return {

            valor: Number(match[1]),
            confianza: 90,
            fuente: "texto"

        };

    }

    return {

        valor: null,
        confianza: 0,
        fuente: null

    };

}

module.exports = {

    extraerBanos

};