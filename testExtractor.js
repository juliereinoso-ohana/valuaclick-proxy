const { extraerDatos } = require("./src/extractors/extractorUniversal");

async function probar() {

    const datos = await extraerDatos(
        "https://www.lamudi.com.mx/desarrollo/41032-73-1991c635a3a8-ed8c-71af1f06-bcf3-4ad4"
    );

    console.log(datos);

}

probar();