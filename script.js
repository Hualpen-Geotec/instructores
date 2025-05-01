const API_URL = "https://script.google.com/macros/s/AKfycbwqSitqZQ4ylWUAqI2SC3E14t0NfFgtEIKCkETuIbdT275id5oi0THT7x8vOGQTW_-8/exec";
let rutInstructor = "";

function validarAcceso() {
  const rut = document.getElementById("rut").value.trim();
  if (!rut) return mostrarError("Por favor ingresa tu RUT.");

  fetch(`${API_URL}?action=validarAccesoInforme&rut=${rut}`)
    .then(res => res.json())
    .then(data => {
      if (data.autorizado) {
        rutInstructor = rut;
        document.getElementById("login").style.display = "none";
        document.getElementById("panel").style.display = "block";
        document.getElementById("bienvenida").innerText = "Bienvenido, " + data.nombre;
        cargarInforme();
      } else {
        mostrarError("RUT no autorizado.");
      }
    });
}

function mostrarError(msg) {
  document.getElementById("mensaje-error").innerText = msg;
}

function cargarInforme() {
  fetch(`${API_URL}?action=obtenerInforme&rut=${rutInstructor}`)
    .then(res => res.json())
    .then(data => {
      if (!data) return;

      document.getElementById("intentos").innerText = data.vecesIngresado;
      document.getElementById("maximo").innerText = data.puntajeMaximo + "%";
      document.getElementById("promedio").innerText = data.promedio + "%";
      document.getElementById("inicio").innerText = data.primerIntento;
      document.getElementById("ultimo").innerText = data.ultimoIntento;

      const ctx = document.getElementById("grafico").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: data.historial.map(p => p.fecha),
          datasets: [{
            label: "Puntaje (%)",
            data: data.historial.map(p => p.puntaje),
            borderColor: "#d4a74f",
            borderWidth: 2,
            fill: false
          }]
        },
        options: {
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });
    });
}
