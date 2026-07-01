const { buscarEnGoogleProvider } = require("../providers/googleProvider");

const PORTALES = [
  { nombre: "Inmuebles24", dominio: "inmuebles24.com" },
  { nombre: "Lamudi", dominio: "lamudi.com.mx" },
  { nombre: "Propiedades.com", dominio: "propiedades.com" },
  { nombre: "Vivanuncios", dominio: "vivanuncios.com.mx" },
  { nombre: "Trovit", dominio: "trovit.com.mx" },
  { nombre: "RE/MAX", dominio: "remax.com.mx" },
  { nombre: "KW México", dominio: "kwmexico.mx" },
  { nombre: "Nocnok", dominio: "nocnok.com" }
];

async function buscarResultados(datos) {
  console.log("Buscando propiedades desde searchService...");

  const resultados = await Promise.all(
    PORTALES.map((portal, index) =>
      buscarEnGoogleProvider(datos, {
        ...portal,
        score: Math.max(95 - index * 3, 70)
      })
    )
  );

  return resultados;
}

module.exports = {
  buscarResultados
};