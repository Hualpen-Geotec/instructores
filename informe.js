const RESULTADOS_URL = "https://script.google.com/macros/s/AKfycbxzGpfD9KSrarirQrn14A08sNZlq0S7wYhacSPZRWv0eDKVXTpm0l-yh_YBuy-kMfwwhQ/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("informesContainer");
  const selector = document.getElementById("selectorRuts");
  const navegacion = document.createElement("div");
  navegacion.id = "navegacion";
  navegacion.style = "margin-top: 20px; text-align: center;";

  let informes = [];
  let indexActual = 0;

  try {
    const res = await fetch(`${RESULTADOS_URL}?listado=1`);
    const lista = await res.json();

    lista.forEach(({ rut, nombre }) => {
      const opt = document.createElement("option");
      opt.value = rut;
      opt.textContent = `${nombre}`;
      selector.appendChild(opt);
    });
  } catch (err) {
    console.error("Error al cargar listado de alumnos:", err);
    contenedor.innerHTML = "<p>🚫 No se pudo cargar la lista de usuarios.</p>";
  }

  document.getElementById("generarInforme").addEventListener("click", async () => {
    contenedor.innerHTML = "";
    informes = [];
    indexActual = 0;
    navegacion.innerHTML = "";

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

        const nombre = registros[0]["NOMBRE"] || "Alumno";
        const notas = registros.map(r => Number(r["NOTA"]) || 0);
        const fechas = registros.map(r => new Date(r["FECHA"]));
        const fechasValidas = fechas.filter(f => !isNaN(f));
        const fechasFormateadas = fechasValidas.map(f => f.toLocaleDateString());

        const columnasErrores = Object.keys(registros[0]).filter(k =>
          ["EPF", "CGR", "EXTINTORES", "ENERGIAS", "EXP_MINERA", "OP_MINA", "OP_INV", "REG_INT_TRANS", "REG_CARGIO", "PROC_CONDUC_INT_MINA", "ESCOLTA", "ACREDITACION"].includes(k)
        );

        const erroresTotales = columnasErrores.reduce((acc, col) => {
          acc[col] = registros.reduce((sum, r) => sum + Number(r[col] || 0), 0);
          return acc;
        }, {});

        const pagina = document.createElement("div");
        pagina.className = "pagina-informe";
        pagina.style.display = "none";
        pagina.innerHTML = `
          <h2>${nombre}</h2>
          <p><strong>Total de intentos:</strong> ${registros.length}</p>
          <p><strong>Primera vez:</strong> ${fechasValidas[0]?.toLocaleString() || "Fecha no válida"}</p>
          <p><strong>Última vez:</strong> ${fechasValidas.at(-1)?.toLocaleString() || "Fecha no válida"}</p>
          <p><strong>Nota más baja:</strong> ${Math.min(...notas)}%</p>
          <p><strong>Nota más alta:</strong> ${Math.max(...notas)}%</p>
          <p><strong>Promedio:</strong> ${Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)}%</p>
          <canvas id="grafNota${rut}" height="180"></canvas>
          <canvas id="grafErrores${rut}" height="180" style="margin-top: 20px;"></canvas>
        `;

        contenedor.appendChild(pagina);
        informes.push({ rut, nombre, pagina, notas, fechas: fechasFormateadas, erroresTotales });

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

    if (informes.length > 0) {
      contenedor.appendChild(navegacion);
      mostrarInforme(0);
    }
  });

  function mostrarInforme(index) {
    informes.forEach((i, idx) => i.pagina.style.display = idx === index ? "block" : "none");
    navegacion.innerHTML = "";

    if (index > 0) {
      const btnAtras = document.createElement("button");
      btnAtras.textContent = "← Atrás";
      btnAtras.onclick = () => mostrarInforme(index - 1);
      navegacion.appendChild(btnAtras);
    }

    if (index < informes.length - 1) {
      const btnSiguiente = document.createElement("button");
      btnSiguiente.textContent = "Siguiente →";
      btnSiguiente.onclick = () => mostrarInforme(index + 1);
      navegacion.appendChild(btnSiguiente);
    }

    if (index === informes.length - 1) {
      const btnGlobal = document.createElement("button");
      btnGlobal.textContent = "Informe Global";
      btnGlobal.onclick = generarInformeGlobal;
      navegacion.appendChild(btnGlobal);
    }

    indexActual = index;
  }

  function generarInformeGlobal() {
    const totalIntentos = informes.reduce((sum, i) => sum + i.notas.length, 0);
    const sumaNotas = informes.reduce((sum, i) => sum + i.notas.reduce((a, b) => a + b, 0), 0);
    const promedioGeneral = Math.round(sumaNotas / totalIntentos);

    const erroresTotalesGlobal = {};
    informes.forEach(i => {
      Object.entries(i.erroresTotales).forEach(([k, v]) => {
        erroresTotalesGlobal[k] = (erroresTotalesGlobal[k] || 0) + v;
      });
    });

    const global = document.createElement("div");
    global.className = "pagina-informe";
    global.innerHTML = `
      <h2>Informe Global</h2>
      <p><strong>Total de intentos:</strong> ${totalIntentos}</p>
      <p><strong>Promedio general:</strong> ${promedioGeneral}%</p>
      <canvas id="grafGlobalErrores" height="200" style="margin-top: 20px;"></canvas>
    `;
    document.getElementById("informesContainer").appendChild(global);
    informes.forEach(i => i.pagina.style.display = "none");
    navegacion.style.display = "none";

    new Chart(document.getElementById("grafGlobalErrores"), {
      type: "bar",
      data: {
        labels: Object.keys(erroresTotalesGlobal),
        datasets: [{
          label: "Errores totales",
          data: Object.values(erroresTotalesGlobal),
          backgroundColor: "#f9c74f"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }
});
