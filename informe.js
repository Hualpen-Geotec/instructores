const BDATOS_URL = "https://script.google.com/macros/s/AKfycbxp8ex9mNRMGt1wh4bLmxv7QjJgC-iMPq0pZnz3DD_xntr0nTC8FSIsSod-Bu88LIOiaQ/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const selector = document.getElementById("selectorRuts");
  const contenedor = document.getElementById("informesContainer");

  let datos = [];

  try {
    const res = await fetch(BDATOS_URL);
    datos = await res.json();
  } catch (error) {
    alert("Error al cargar los datos.");
    return;
  }

  // Crear lista de usuarios únicos
  const usuarios = {};
  datos.forEach(row => {
    const nombre = row["NOMBRE"];
    const rut = row["RUT"];
    if (nombre && rut && !usuarios[rut]) {
      usuarios[rut] = nombre;
    }
  });

  // Llenar el selector
  for (const rut in usuarios) {
    const option = document.createElement("option");
    option.value = rut;
    option.textContent = `${usuarios[rut]} (${rut})`;
    selector.appendChild(option);
  }

  document.getElementById("generarInforme").addEventListener("click", () => {
    contenedor.innerHTML = "";
    const seleccionados = Array.from(selector.selectedOptions).map(opt => opt.value);
    const resumenGlobal = {
      totalIntentos: 0,
      sumaNotas: 0,
      notaMin: 100,
      notaMax: 0,
      erroresPorFuente: {}
    };

    seleccionados.forEach(rut => {
      const registros = datos.filter(d => d.RUT === rut);
      if (registros.length === 0) return;

      const nombre = registros[0]["NOMBRE"];
      const notas = registros.map(r => Number(r["NOTA"] || 0));
      const fechas = registros.map(r => new Date(r["FECHA"]));
      const fuentes = [
        "EPF", "CGR", "EXTINTORES", "ENERGIAS", "EXP_MINERA",
        "OP_INV", "REG_INT_TRANS", "REG_CARGIO", "PROC_CONDUC_INT_MINA"
      ];
      const errores = {};
      fuentes.forEach(f => errores[f] = 0);

      registros.forEach(r => {
        fuentes.forEach(f => {
          errores[f] += Number(r[f] || 0);
          resumenGlobal.erroresPorFuente[f] = (resumenGlobal.erroresPorFuente[f] || 0) + Number(r[f] || 0);
        });
      });

      // Crear informe individual
      const div = document.createElement("div");
      div.className = "pagina-informe";
      div.innerHTML = `
        <h2>${nombre} (${rut})</h2>
        <p><strong>Total intentos:</strong> ${registros.length}</p>
        <p><strong>Primera vez:</strong> ${fechas.sort((a, b) => a - b)[0].toLocaleDateString()}</p>
        <p><strong>Última vez:</strong> ${fechas.sort((a, b) => b - a)[0].toLocaleDateString()}</p>
        <p><strong>Nota más baja:</strong> ${Math.min(...notas)}%</p>
        <p><strong>Nota más alta:</strong> ${Math.max(...notas)}%</p>
        <p><strong>Promedio:</strong> ${Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)}%</p>
        <canvas id="grafNota${rut}" height="180"></canvas>
        <canvas id="grafErrores${rut}" height="180"></canvas>
      `;
      contenedor.appendChild(div);

      // Gráfico de progreso de notas
      new Chart(document.getElementById("grafNota" + rut), {
        type: "line",
        data: {
          labels: registros.map(r => r["FECHA"]),
          datasets: [{
            label: "Nota (%)",
            data: notas,
            borderColor: "blue",
            fill: false
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });

      // Gráfico de errores por fuente
      new Chart(document.getElementById("grafErrores" + rut), {
        type: "bar",
        data: {
          labels: fuentes,
          datasets: [{
            label: "Errores",
            data: fuentes.map(f => errores[f]),
            backgroundColor: "tomato"
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });

      // Acumulado global
      resumenGlobal.totalIntentos += registros.length;
      resumenGlobal.sumaNotas += notas.reduce((a, b) => a + b, 0);
      resumenGlobal.notaMin = Math.min(resumenGlobal.notaMin, ...notas);
      resumenGlobal.notaMax = Math.max(resumenGlobal.notaMax, ...notas);
    });

    // Mostrar resumen general si hay más de uno seleccionado
    if (seleccionados.length > 1) {
      const div = document.createElement("div");
      div.className = "pagina-informe";
      div.innerHTML = `
        <h2>Resumen General</h2>
        <p><strong>Total de intentos:</strong> ${resumenGlobal.totalIntentos}</p>
        <p><strong>Promedio general:</strong> ${Math.round(resumenGlobal.sumaNotas / resumenGlobal.totalIntentos)}%</p>
        <p><strong>Nota más baja:</strong> ${resumenGlobal.notaMin}%</p>
        <p><strong>Nota más alta:</strong> ${resumenGlobal.notaMax}%</p>
        <canvas id="grafGlobalErrores" height="180"></canvas>
      `;
      contenedor.appendChild(div);

      new Chart(document.getElementById("grafGlobalErrores"), {
        type: "bar",
        data: {
          labels: Object.keys(resumenGlobal.erroresPorFuente),
          datasets: [{
            label: "Errores totales",
            data: Object.values(resumenGlobal.erroresPorFuente),
            backgroundColor: "orange"
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });
    }
  });
});
