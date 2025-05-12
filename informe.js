const RESULTADOS_URL = "https://script.google.com/macros/s/AKfycbzAb1C1r9qxSduKBxLcD-xZDShem_zUrYA6Dfy6_oraHHYK1GaTzaeb4Ofv7YgjFMfalQ/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const rut = localStorage.getItem("rut_instructor");
  const contenedor = document.getElementById("informe");

  if (!rut) {
    contenedor.innerHTML = "<p>⚠️ No se ha encontrado un RUT válido en esta sesión.</p>";
    return;
  }

  contenedor.innerHTML = "<p>🔄 Cargando información del instructor...</p>";

  try {
    const res = await fetch(`${RESULTADOS_URL}?rut=${encodeURIComponent(rut)}`);
    const registros = await res.json();

    if (registros.length === 0) {
      contenedor.innerHTML = "<p>❌ No se encontraron registros para este RUT.</p>";
      return;
    }

    const nombre = registros[0]["Nombre"] || "Instructor";
    const fechas = registros.map(r => new Date(r["Fecha"])).sort((a, b) => a - b);
    const notas = registros.map(r => Number(r["Nota"]) || 0);

    contenedor.innerHTML = `
      <h2>Informe académico de ${nombre}</h2>
      <p><strong>Total de intentos:</strong> ${registros.length}</p>
      <p><strong>Primera vez:</strong> ${fechas[0].toLocaleString()}</p>
      <p><strong>Última vez:</strong> ${fechas[fechas.length - 1].toLocaleString()}</p>
      <p><strong>Nota más baja:</strong> ${Math.min(...notas)}%</p>
      <p><strong>Nota más alta:</strong> ${Math.max(...notas)}%</p>
      <p><strong>Promedio:</strong> ${Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)}%</p>

      <table border="1" style="width:100%; margin-top: 20px; border-collapse: collapse;">
        <thead style="background-color:#f2f2f2;">
          <tr>
            ${Object.keys(registros[0]).map(k => `<th>${k}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${registros.map(r => `
            <tr>
              ${Object.values(r).map(v => `<td>${v}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error("❌ Error al obtener los datos:", err);
    contenedor.innerHTML = "<p>🚫 Ocurrió un error al obtener los resultados. Intente más tarde.</p>";
  }
});
