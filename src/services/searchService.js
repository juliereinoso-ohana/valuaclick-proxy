const {
  buscarEnLamudiProvider
} = require("../providers/lamudiProvider");

const {
  extraerDatos
} = require("../extractors/extractorUniversal");

const {
  buscarEnSearXProvider
} = require("../providers/searxProvider");

const PORTALES = [
  {
    nombre: "Lamudi",
    dominio: "lamudi.com.mx",
    score: 92
  }
];

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

function validarDatosBusqueda(datos = {}) {
  const tieneUbicacion =
    datos.estado ||
    datos.ciudad ||
    datos.colonia;

  if (!datos.tipo) {
    throw new Error("Debes indicar el tipo de propiedad");
  }

  if (!datos.operacion) {
    throw new Error("Debes indicar si la búsqueda es venta o renta");
  }

  if (!tieneUbicacion) {
    throw new Error(
      "Debes indicar al menos estado, ciudad o colonia"
    );
  }
}

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
     buscarEnLamudiProvider(datos)
    )
  );

  const resultadosExitosos = [];
  const portalesConError = [];

  resultadosPortales.forEach((respuesta, index) => {
    const portal = PORTALES[index];

    if (respuesta.status === "fulfilled") {
      resultadosExitosos.push(...respuesta.value);

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

  const resultadosLimpios =
    eliminarDuplicados(resultadosExitosos);

  const resultadosOrdenados =
    resultadosLimpios.sort(
      (a, b) =>
        Number(b.score_comercial || 0) -
        Number(a.score_comercial || 0)
    );
  const resultadosEnriquecidos = resultadosOrdenados.slice(0, 5);

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
    resultados: resultadosEnriquecidos,
    resumen: {
      total_resultados: resultadosEnriquecidos.length,
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