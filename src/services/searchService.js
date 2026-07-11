const { buscarEnGoogleProvider } = require("../providers/googleProvider");

const PORTALES = [
  { nombre: "Inmuebles24", dominio: "inmuebles24.com" },
  { nombre: "Lamudi", dominio: "lamudi.com.mx" },
  { nombre: "Propiedades.com", dominio: "propiedades.com" },
  { nombre: "Vivanuncios", dominio: "vivanuncios.com.mx" },
  { nombre: "Trovit", dominio: "trovit.com.mx" }
];

async function buscarResultados(datos) {
  console.log("Buscando propiedades reales desde Google...");

  const respuestas = await Promise.all(
    PORTALES.map((portal, index) =>
      buscarEnGoogleProvider(datos, {
        ...portal,
        score: Math.max(95 - index * 3, 70)
      })
    )
  );

  return respuestas.flat();
}

module.exports = {
  buscarResultados
};