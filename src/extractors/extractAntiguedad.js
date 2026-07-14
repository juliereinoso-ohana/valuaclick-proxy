function extraerAntiguedad(texto = "") {

    const contenido = String(texto)
        .replace(/\s+/g, " ")
        .trim();

    if (/nuevo|a estrenar/i.test(contenido)) {
        return {
            valor: 0,
            confianza: 95,
            fuente: "texto"
        };
    }

    if (/preventa|en construcción/i.test(contenido)) {
        return {
            valor: -1,
            confianza: 95,
            fuente: "texto"
        };
    }

    const patrones = [

        /(\d+)\s*años?/i,

        /antigüedad[\s:,-]{0,15}(\d+)/i

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
    extraerAntiguedad
};