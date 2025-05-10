
const RESULTADOS_URL = "https://script.google.com/macros/s/AKfycbxp8ex9mNRMGt1wh4bLmxv7QjJgC-iMPq0pZnz3DD_xntr0nTC8FSIsSod-Bu88LIOiaQ/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const rut = localStorage.getItem("rut_instructor") || "";

  if (!rut) {
    alert("Debes ingresar con tu RUT.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("rutUsuario").textContent = rut;

  try {
    const res = await fetch(`${RESULTADOS_URL}?rut=${rut}`);
    const data = await res.json();
    const registros = data.datos;

    if (!registros || registros.length === 0) {
      document.querySelector(".container").innerHTML += "<p>No se encontraron resultados para este RUT.</p>";
      return;
    }

    const fechas = registros.map(r => new Date(r["Fecha"]));
    const notas = registros.map(r => parseInt(r["Nota (%)"]));
    const fuentes = ["EPF", "CGR", "EXTINTORES", "ENERGIAS", "EXP_MINERA", "OP_INV", "REG_INT_TRANS", "REG_CARGIO", "PROC_CONDUC_INT_MINA"];

    const primera = new Date(Math.min(...fechas));
    const ultima = new Date(Math.max(...fechas));
    const notaMin = Math.min(...notas);
    const notaMax = Math.max(...notas);
    const promedio = Math.round(notas.reduce((a, b) => a + b, 0) / notas.length);

    document.getElementById("totalIntentos").textContent = registros.length;
    document.getElementById("primeraVez").textContent = primera.toLocaleDateString();
    document.getElementById("ultimaVez").textContent = ultima.toLocaleDateString();
    document.getElementById("notaMin").textContent = notaMin + "%";
    document.getElementById("notaMax").textContent = notaMax + "%";
    document.getElementById("promedioNota").textContent = promedio + "%";

    const ctx1 = document.getElementById("graficoProgreso").getContext("2d");
    new Chart(ctx1, {
      type: "line",
      data: {
        labels: fechas.map(f => f.toLocaleDateString()),
        datasets: [{
          label: "Nota (%)",
          data: notas,
          fill: false,
          borderColor: "blue",
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });

    const erroresTotales = {};
    fuentes.forEach(fuente => erroresTotales[fuente] = 0);
    registros.forEach(r => {
      fuentes.forEach(f => {
        erroresTotales[f] += parseInt(r[f] || 0);
      });
    });

    const ctx2 = document.getElementById("graficoErrores").getContext("2d");
    new Chart(ctx2, {
      type: "bar",
      data: {
        labels: fuentes,
        datasets: [{
          label: "Errores totales",
          data: fuentes.map(f => erroresTotales[f]),
          backgroundColor: "rgba(255, 99, 132, 0.6)"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

  } catch (err) {
    console.error("Error cargando informe:", err);
    alert("No se pudo cargar la información del informe.");
  }
});
