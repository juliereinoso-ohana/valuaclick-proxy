function limpiarNumero(valor) {
    if (!valor) return null;

    const numero = Number(
        String(valor)
            .replace(",", "")
            .replace(/[^\d.]/g, "")
    );

    return Number.isFinite(numero)
        ? numero
        : null;
}

function extraerConstruccion(texto = "") {

    const patrones = [

        /Construcci[oó]n[\s\S]{0,40}?(\d+(?:[.,]\d+)?)\s*m²/i,

        /Superficie[\s\S]{0,40}?(\d+(?:[.,]\d+)?)\s*m²/i,

        /[ÁA]rea construida[\s\S]{0,40}?(\d+(?:[.,]\d+)?)\s*m²/i,

        /(\d+(?:[.,]\d+)?)\s*m²\s*de\s*construcci[oó]n/i

    ];

    for (const patron of patrones) {

        const match = texto.match(patron);

        if (!match) continue;

        const metros = limpiarNumero(match[1]);

        if (metros) {

            return {

                valor: metros,
                confianza: 90,
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

    extraerConstruccion

};
