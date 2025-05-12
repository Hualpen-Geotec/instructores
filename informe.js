
const RESULTADOS_URL = "https://script.google.com/macros/s/AKfycbxzGpfD9KSrarirQrn14A08sNZlq0S7wYhacSPZRWv0eDKVXTpm0l-yh_YBuy-kMfwwhQ/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("informesContainer");
  const selector = document.getElementById("selectorRuts");

  try {
    // Cargar listado de alumnos únicos
    const res = await fetch(`${RESULTADOS_URL}?listado=1`);
    const lista = await res.json();

    lista.forEach(({ rut, nombre }) => {
      const opt = document.createElement("option");
      opt.value = rut;
      opt.textContent = `${nombre} (${rut})`;
      selector.appendChild(opt);
    });
  } catch (err) {
    console.error("Error al cargar listado de alumnos:", err);
    contenedor.innerHTML = "<p>🚫 No se pudo cargar la lista de usuarios.</p>";
  }

  document.getElementById("generarInforme").addEventListener("click", async () => {
    contenedor.innerHTML = "";
    const seleccionados = Array.from(selector.selectedOptions).map(opt => opt.value);

    if (seleccionados.length === 0) {
      contenedor.innerHTML = "<p>⚠️ Seleccione al menos un alumno.</p>";
      return;
    }

    for (const rut of seleccionados) {
      try {
        const res = await fetch(`${RESULTADOS_URL}?rut=${encodeURIComponent(rut)}`);
        const registros = await res.json();
        if (registros.length === 0) continue;

        const nombre = registros[0]["Nombre"] || "Alumno";
        const notas = registros.map(r => Number(r["Nota"]) || 0);
        const fechas = registros.map(r => new Date(r["Fecha"]));
        const fechasFormateadas = fechas.map(f => f.toLocaleDateString());

        const columnasErrores = Object.keys(registros[0]).filter(k =>
          ["EPF", "CGR", "EXTINTORES", "ENERGIAS", "EXP_MINERA", "OP_INV", "REG_INT_TRANS", "REG_CARGIO", "PROC_CONDUC_INT_MINA"].includes(k)
        );

        const erroresTotales = columnasErrores.reduce((acc, col) => {
          acc[col] = registros.reduce((sum, r) => sum + Number(r[col] || 0), 0);
          return acc;
        }, {});

        const div = document.createElement("div");
        div.className = "pagina-informe";
        div.innerHTML = `
          <h2>${nombre} (${rut})</h2>
          <p><strong>Total de intentos:</strong> ${registros.length}</p>
          <p><strong>Primera vez:</strong> ${fechas.sort((a, b) => a - b)[0].toLocaleString()}</p>
          <p><strong>Última vez:</strong> ${fechas.sort((a, b) => b - a)[0].toLocaleString()}</p>
          <p><strong>Nota más baja:</strong> ${Math.min(...notas)}%</p>
          <p><strong>Nota más alta:</strong> ${Math.max(...notas)}%</p>
          <p><strong>Promedio:</strong> ${Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)}%</p>

          <canvas id="grafNota${rut}" height="180"></canvas>
          <canvas id="grafErrores${rut}" height="180" style="margin-top: 20px;"></canvas>

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
        contenedor.appendChild(div);

        new Chart(document.getElementById("grafNota" + rut), {
          type: "line",
          data: {
            labels: fechasFormateadas,
            datasets: [{
              label: "Nota (%)",
              data: notas,
              borderColor: "#42a5f5",
              fill: false,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } }
          }
        });

        new Chart(document.getElementById("grafErrores" + rut), {
          type: "bar",
          data: {
            labels: Object.keys(erroresTotales),
            datasets: [{
              label: "Errores",
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
        console.error(`Error al cargar datos para ${rut}:`, err);
      }
    }
  });
});
