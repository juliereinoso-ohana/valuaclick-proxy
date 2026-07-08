require("dotenv").config();
const axios = require("axios");

async function testGoogle() {
  try {
    console.log("API:", process.env.GOOGLE_API_KEY?.substring(0, 12) + "...");
    console.log("CX:", process.env.GOOGLE_CX);

    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_CX,
        q: "casa venta cancun inmuebles24",
        num: 3,
        gl: "mx",
        hl: "es"
      }
    });

    console.log("RESULTADOS:", response.data.items?.length || 0);

    (response.data.items || []).forEach((item, i) => {
      console.log("\n#", i + 1);
      console.log("Título:", item.title);
      console.log("Link:", item.link);
    });

  } catch (error) {
    console.error("ERROR GOOGLE:");
    console.error(error.response?.data || error.message);
  }
}

testGoogle();