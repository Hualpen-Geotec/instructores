const RESULTADOS_URL = "https://script.google.com/macros/s/AKfycbxzGpfD9KSrarirQrn14A08sNZlq0S7wYhacSPZRWv0eDKVXTpm0l-yh_YBuy-kMfwwhQ/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const rut = localStorage.getItem("rut_instructor");
  const contenedor = document.getElementById("informe");

  if (!rut) {
    contenedor.innerHTML = "<p>⚠️ No se encontró el RUT del instructor.</p>";
    return;
  }

  contenedor.innerHTML = "<p>🔄 Cargando información desde la base de datos...</p>";

  try {
    const res = await fetch(`${RESULTADOS_URL}?rut=${encodeURIComponent(rut)}`);
    const registros = await res.json();

    if (registros.length === 0) {
      contenedor.innerHTML = "<p>❌ No hay datos registrados para este RUT.</p>";
      return;
    }

    const nombre = registros[0]["Nombre"] || "Instructor";
    const notas = registros.map(r => Number(r["Nota"]) || 0);
    const fechas = registros.map(r => new Date(r["Fecha"])).sort((a, b) => a - b);
    const fechasFormateadas = fechas.map(f => f.toLocaleDateString());

    // Detectar fuentes de errores por columnas
    const columnasErrores = Object.keys(registros[0]).filter(k =>
      ["EPF", "CGR", "EXTINTORES", "ENERGIAS", "EXP_MINERA", "OP_INV", "REG_INT_TRANS", "REG_CARGIO", "PROC_CONDUC_INT_MINA"].includes(k)
    );

    const erroresTotales = columnasErrores.reduce((acc, col) => {
      acc[col] = registros.reduce((sum, r) => sum + Number(r[col] || 0), 0);
      return acc;
    }, {});

    contenedor.innerHTML = `
      <h2>Informe académico de ${nombre}</h2>
      <p><strong>Total de intentos:</strong> ${registros.length}</p>
      <p><strong>Primera vez:</strong> ${fechas[0].toLocaleString()}</p>
      <p><strong>Última vez:</strong> ${fechas[fechas.length - 1].toLocaleString()}</p>
      <p><strong>Nota más baja:</strong> ${Math.min(...notas)}%</p>
      <p><strong>Nota más alta:</strong> ${Math.max(...notas)}%</p>
      <p><strong>Promedio:</strong> ${Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)}%</p>

      <canvas id="grafNotas" height="200"></canvas>
      <canvas id="grafErrores" height="200" style="margin-top: 40px;"></canvas>

      <hr />
      <h3>Detalle por intento:</h3>
      <table border="1" style="width:100%; border-collapse: collapse; margin-top: 1rem;">
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

    // 📈 Gráfico de notas
    new Chart(document.getElementById("grafNotas"), {
      type: "line",
      data: {
        labels: fechasFormateadas,
        datasets: [{
          label: "Nota (%)",
          data: notas,
          fill: false,
          borderColor: "#42a5f5",
          backgroundColor: "#bbdefb",
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    });

    // 📊 Gráfico de errores
    new Chart(document.getElementById("grafErrores"), {
      type: "bar",
      data: {
        labels: Object.keys(erroresTotales),
        datasets: [{
          label: "Errores acumulados",
          data: Object.values(erroresTotales),
          backgroundColor: "#ef9a9a"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });

  } catch (err) {
    console.error("❌ Error al obtener los datos:", err);
    contenedor.innerHTML = "<p>🚫 Error al cargar datos. Intente más tarde.</p>";
  }
});
