const BDATOS_URL = "bdatos.csv";

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim();
    });
    return obj;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const selector = document.getElementById("selectorRuts");
  const contenedor = document.getElementById("informesContainer");

  let datos = [];

  try {
    const res = await fetch(BDATOS_URL);
    const text = await res.text();
    datos = parseCSV(text);
  } catch (error) {
    alert("Error al cargar el archivo CSV.");
    return;
  }

  // ... aquí continúa el script normal, usando `datos`
});
