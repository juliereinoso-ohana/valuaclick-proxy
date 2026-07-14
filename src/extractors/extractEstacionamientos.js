function extraerEstacionamientos(texto = "") {

    const contenido = String(texto)
        .replace(/\s+/g, " ")
        .trim();

    const patrones = [

        /(\d+)\s*(?:estacionamientos?|cocheras?|cajones?)/i,

        /(?:estacionamientos?|cocheras?|cajones?)[\s:,-]{0,15}(\d+)/i,

        /garage[\s:,-]{0,15}(\d+)/i

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

    extraerEstacionamientos

};