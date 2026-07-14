function convertirFechaISO(anio, mes, dia) {
  const fecha = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia)
  );

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha.toISOString().slice(0, 10);
}

function calcularFechaRelativa(cantidad, unidad) {
  const fecha = new Date();

  const numero = Number(cantidad);

  if (!Number.isFinite(numero)) {
    return null;
  }

  const unidadNormalizada = String(unidad).toLowerCase();

  if (unidadNormalizada.startsWith("día")) {
    fecha.setDate(fecha.getDate() - numero);
  } else if (unidadNormalizada.startsWith("semana")) {
    fecha.setDate(fecha.getDate() - numero * 7);
  } else if (unidadNormalizada.startsWith("mes")) {
    fecha.setMonth(fecha.getMonth() - numero);
  } else if (unidadNormalizada.startsWith("año")) {
    fecha.setFullYear(fecha.getFullYear() - numero);
  } else {
    return null;
  }

  return fecha.toISOString().slice(0, 10);
}

function extraerFechaPublicacion(texto = "") {
  const contenido = String(texto)
    .replace(/\s+/g, " ")
    .trim();

  const patronesExactos = [
    /publicad[oa]\s+el\s+(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i,
    /fecha\s+de\s+publicaci[oó]n[\s:,-]{0,15}(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i,
    /publicad[oa][\s:,-]{0,15}(\d{4})-(\d{2})-(\d{2})/i
  ];

  for (let index = 0; index < patronesExactos.length; index += 1) {
    const coincidencia = contenido.match(patronesExactos[index]);

    if (!coincidencia) {
      continue;
    }

    let fecha = null;

    if (index === 2) {
      fecha = convertirFechaISO(
        coincidencia[1],
        coincidencia[2],
        coincidencia[3]
      );
    } else {
      fecha = convertirFechaISO(
        coincidencia[3],
        coincidencia[2],
        coincidencia[1]
      );
    }

    if (fecha) {
      return {
        valor: fecha,
        confianza: 95,
        fuente: "texto_fecha_exacta"
      };
    }
  }

  const patronRelativo =
    /publicad[oa]\s+hace\s+(\d+)\s+(d[ií]as?|semanas?|meses?|a[nñ]os?)/i;

  const coincidenciaRelativa = contenido.match(patronRelativo);

  if (coincidenciaRelativa) {
    const fecha = calcularFechaRelativa(
      coincidenciaRelativa[1],
      coincidenciaRelativa[2]
    );

    if (fecha) {
      return {
        valor: fecha,
        confianza: 80,
        fuente: "texto_fecha_relativa"
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
  extraerFechaPublicacion
};