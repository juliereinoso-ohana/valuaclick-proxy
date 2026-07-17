const {
  buscarEnLamudiProvider
} = require("./src/providers/lamudiProvider");

(async () => {
  try {

    const resultados = await buscarEnLamudiProvider({
      operacion: "Venta",
      tipo: "Casa",
      estado: "Veracruz",
      ciudad: "Boca del Río"
    });

    console.log("================================");
    console.log("RESULTADOS");
    console.log("================================");
    console.log(resultados);

  } catch (e) {

    console.error(e);

  }
})();