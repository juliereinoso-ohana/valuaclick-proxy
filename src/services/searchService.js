const {
  buscarEnGoogleProvider
} = require("../providers/googleProvider");

const PORTALES = [
  {
    nombre: "Inmuebles24",
    dominio: "inmuebles24.com",
    score: 95
  },
  {
    nombre: "Lamudi",
    dominio: "lamudi.com.mx",
    score: 92
  },
  {
    nombre: "Propiedades.com",
    dominio: "propiedades.com",
    score: 89
  },
  {
    nombre: "Vivanuncios",
    dominio: "vivanuncios.com.mx",
    score: 86
  },
  {
    nombre: "Trovit",
    dominio: "trovit.com.mx",
    score: 83
  }
];

/**
 * Elimina resultados duplicados usando la URL como identificador.
 */
function eliminarDuplicados(resultados = []) {
  const urlsVistas = new Set();

  return resultados.filter((resultado) => {
    const url = resultado?.url_fuente;

    if (!url || urlsVistas.has(url)) {
      return false;
    }

    urlsVistas.add(url);
    return true;
  });
}

/**
 * Valida que existan datos mínimos para hacer una búsqueda útil.
 */
function validarDatosBusqueda(datos = {}) {
  const tieneUbicacion =
    datos.estado ||
    datos.ciudad ||
    datos.colonia;

  if (!datos.tipo) {
    throw new Error(
      "Debes indicar el tipo de propiedad"
    );
  }

  if (!datos.operacion) {
    throw new Error(
      "Debes indicar si la búsqueda es venta o renta"
    );
  }

  if (!tieneUbicacion) {
    throw new Error(
      "Debes indicar al menos estado, ciudad o colonia"
    );
  }
}

/**
 * Ejecuta las búsquedas sin cancelar todo el proceso
 * cuando uno de los portales presenta un error.
 */
async function buscarResultados(datos = {}) {
  validarDatosBusqueda(datos);

  console.log("====================================");
  console.log("INICIANDO BÚSQUEDA DE COMPARABLES");
  console.log("Tipo:", datos.tipo);
  console.log("Operación:", datos.operacion);
  console.log("Ciudad:", datos.ciudad || "No indicada");
  console.log("Colonia:", datos.colonia || "No indicada");
  console.log("====================================");

  const resultadosPortales = await Promise.allSettled(
    PORTALES.map((portal) =>
      buscarEnGoogleProvider(datos, portal)
    )
  );

  const resultadosExitosos = [];
  const portalesConError = [];

  resultadosPortales.forEach((respuesta, index) => {
    const portal = PORTALES[index];

    if (respuesta.status === "fulfilled") {
      resultadosExitosos.push(
        ...respuesta.value
      );

      console.log(
        `${portal.nombre}: ${respuesta.value.length} resultados`
      );
    } else {
      portalesConError.push({
        portal: portal.nombre,
        error:
          respuesta.reason?.message ||
          "Error desconocido"
      });

      console.error(
        `${portal.nombre}:`,
        respuesta.reason?.message ||
          "Error desconocido"
      );
    }
  });

  const resultadosLimpios = eliminarDuplicados(
    resultadosExitosos
  );

  const resultadosOrdenados = resultadosLimpios.sort(
    (a, b) =>
      Number(b.score_comercial || 0) -
      Number(a.score_comercial || 0)
  );

  console.log("====================================");
  console.log(
    "Resultados totales:",
    resultadosOrdenados.length
  );
  console.log(
    "Portales con error:",
    portalesConError.length
  );
  console.log("====================================");

  return {
    resultados: resultadosOrdenados,
    resumen: {
      total_resultados: resultadosOrdenados.length,
      portales_consultados: PORTALES.length,
      portales_exitosos:
        PORTALES.length - portalesConError.length,
      portales_con_error: portalesConError
    }
  };
}

module.exports = {
  buscarResultados,
  PORTALES
};