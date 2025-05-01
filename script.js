
const API_URL = "https://script.google.com/macros/s/AKfycbzpe1sCH9zcREDq8M12VV2q5C3KpnibWyKHASWiPKVEGJnnG-qffAL7QeaTiDOrs-r87A/exec";
let rutInstructor = "";
let nombreInstructor = "";

function validarAcceso() {
  const rut = document.getElementById("rut").value.trim();
  fetch(`${API_URL}?action=validarAccesoInforme&rut=${rut}`)
    .then(res => res.json())
    .then(data => {
      if (data.autorizado) {
        rutInstructor = rut;
        nombreInstructor = data.nombre;
        document.getElementById("login-section").style.display = "none";
        document.getElementById("panel-instructor").style.display = "block";
        document.getElementById("bienvenida").innerText = `Bienvenido, ${nombreInstructor}`;
        cargarSolicitudes();
        cargarInforme();
      } else {
        document.getElementById("error-rut").innerText = "RUT no autorizado.";
      }
    });
}

function cargarSolicitudes() {
  fetch(API_URL + "?action=cargarSolicitudes")
    .then(res => res.json())
    .then(data => {
      const cont = document.getElementById("solicitudes");
      if (!data.length) {
        cont.innerHTML = "<p>No hay solicitudes pendientes.</p>";
        return;
      }
      let html = "<table><tr><th>Nombre</th><th>RUT</th><th>Correo</th><th>Acción</th></tr>";
      data.forEach(row => {
        html += `<tr><td>${row.nombre}</td><td>${row.rut}</td><td>${row.correo}</td>
        <td>
        <button onclick="aceptar('${row.rut}')">Aceptar</button>
        <button onclick="rechazar('${row.rut}')">Rechazar</button>
        </td></tr>`;
      });
      html += "</table>";
      cont.innerHTML = html;
    });
}

function aceptar(rutSolicitado) {
  const fechaFin = prompt("Ingrese la fecha de vencimiento de la licencia roja (YYYY-MM-DD):");
  if (!fechaFin) return;
  fetch(API_URL + "?action=gestionarSolicitud", {
    method: "POST",
    body: JSON.stringify({
      rutSolicitado, decision: "Aceptado",
      fechaFin, rutInstructor
    })
  }).then(() => cargarSolicitudes());
}

function rechazar(rutSolicitado) {
  if (!confirm("¿Está seguro de rechazar esta solicitud?")) return;
  fetch(API_URL + "?action=gestionarSolicitud", {
    method: "POST",
    body: JSON.stringify({
      rutSolicitado, decision: "Rechazado",
      fechaFin: "", rutInstructor
    })
  }).then(() => cargarSolicitudes());
}

function cargarInforme() {
  fetch(`${API_URL}?action=obtenerInforme&rut=${rutInstructor}`)
    .then(res => res.json())
    .then(data => {
      if (!data) return;
      document.getElementById("informe").innerHTML = `
        <p>Intentos: ${data.vecesIngresado}</p>
        <p>Puntaje Máximo: ${data.puntajeMaximo}</p>
        <p>Desde: ${data.primerIntento}</p>
        <p>Último intento: ${data.ultimoIntento}</p>
      `;
      new Chart(document.getElementById("grafico"), {
        type: "line",
        data: {
          labels: data.historial.map(h => h.fecha),
          datasets: [{
            label: "Puntaje",
            data: data.historial.map(h => h.puntaje),
            borderColor: "#f39c12",
            fill: false
          }]
        }
      });
    });
}
