const BDATOS_URL = "bdatos.csv";

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const selector = document.createElement("select");
  selector.id = "selectorRuts";
  selector.multiple = true;
  selector.style.width = "100%";
  document.getElementById("informe").prepend(selector);

  const boton = document.createElement("button");
  boton.id = "generarInforme";
  boton.textContent = "Generar Informe";
  document.getElementById("informe").prepend(boton);

  const contenedor = document.createElement("div");
  contenedor.id = "informesContainer";
  document.getElementById("informe").appendChild(contenedor);

  let datos = [];

  try {
    const res = await fetch(BDATOS_URL);
    if (!res.ok) throw new Error("No se pudo cargar CSV");
    const text = await res.text();
    datos = parseCSV(text);
  } catch (error) {
    alert("Error al cargar el archivo CSV.");
    console.error(error);
    return;
  }

  const usuarios = {};
  datos.forEach(row => {
    const nombre = row["Nombre"];
    const rut = row["RUT"];
    if (nombre && rut && !usuarios[rut]) {
      usuarios[rut] = nombre;
    }
  });

  for (const rut in usuarios) {
    const option = document.createElement("option");
    option.value = rut;
    option.textContent = `${usuarios[rut]} (${rut})`;
    selector.appendChild(option);
  }

  boton.addEventListener("click", () => {
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
      const registros = datos.filter(d => d["RUT"] === rut);
      if (registros.length === 0) return;

      const nombre = registros[0]["Nombre"];
      const notas = registros.map(r => Number(r["Nota"] || 0));
      const fechas = registros.map(r => new Date(r["Fecha"]));
      const fuentes = [
        "EPF", "CGR", "EXTINTORES", "ENERGIAS", "EXP_MINERA",
        "OP_INV", "REG_INT_TRANS", "REG_CARGIO", "PROC_CONDUC_INT_MINA"
      ];
      const errores = {};
      fuentes.forEach(f => errores[f] = 0);

      registros.forEach(r => {
        fuentes.forEach(f => {
          const val = Number(r[f] || 0);
          errores[f] += val;
          resumenGlobal.erroresPorFuente[f] = (resumenGlobal.erroresPorFuente[f] || 0) + val;
        });
      });

      const div = document.createElement("div");
      div.className = "pagina-informe";
      div.innerHTML = `
        <h2>${nombre} (${rut})</h2>
        <p><strong>Total intentos:</strong> ${registros.length}</p>
        <p><strong>Primera vez:</strong> ${fechas.sort((a, b) => a - b)[0].toLocaleString()}</p>
        <p><strong>Última vez:</strong> ${fechas.sort((a, b) => b - a)[0].toLocaleString()}</p>
        <p><strong>Nota más baja:</strong> ${Math.min(...notas)}%</p>
        <p><strong>Nota más alta:</strong> ${Math.max(...notas)}%</p>
        <p><strong>Promedio:</strong> ${Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)}%</p>
        <canvas id="grafNota${rut}" height="180"></canvas>
        <canvas id="grafErrores${rut}" height="180"></canvas>
      `;
      contenedor.appendChild(div);

      new Chart(document.getElementById("grafNota" + rut), {
        type: "line",
        data: {
          labels: registros.map(r => r["Fecha"]),
          datasets: [{
            label: "Nota (%)",
            data: notas,
            borderColor: "#8ecae6",
            backgroundColor: "rgba(142, 202, 230, 0.2)",
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });

      new Chart(document.getElementById("grafErrores" + rut), {
        type: "bar",
        data: {
          labels: fuentes,
          datasets: [{
            label: "Errores",
            data: fuentes.map(f => errores[f]),
            backgroundColor: "#f7a072"
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });

      resumenGlobal.totalIntentos += registros.length;
      resumenGlobal.sumaNotas += notas.reduce((a, b) => a + b, 0);
      resumenGlobal.notaMin = Math.min(resumenGlobal.notaMin, ...notas);
      resumenGlobal.notaMax = Math.max(resumenGlobal.notaMax, ...notas);
    });

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
});
