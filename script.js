// --- Variables Globales ---
let nombreInstructor = "";
let rutInstructor = "";

// --- Funciones Iniciales ---
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").addEventListener("click", validarLogin);
  document.getElementById("buscarBtn").addEventListener("click", buscarAlumno);
});

// --- Función para validar acceso ---
function validarLogin() {
  const rut = document.getElementById("rutInput").value.trim();
  if (!rut) {
    mostrarError("Ingrese un RUT válido.");
    return;
  }

  fetch(`${API_URL}?action=validarAccesoInforme&rut=${encodeURIComponent(rut)}`)
    .then(response => response.json())
    .then(data => {
      if (data.autorizado) {
        nombreInstructor = data.nombre;
        rutInstructor = rut;
        document.getElementById("login-section").style.display = "none";
        document.getElementById("main-section").style.display = "block";
        document.getElementById("instructorName").textContent = nombreInstructor;
        cargarSolicitudes();
        cargarInformePersonal(rutInstructor);
      } else {
        mostrarError("Acceso denegado. Contacte a su supervisor.");
      }
    })
    .catch(error => mostrarError("Error de conexión. Intente nuevamente."));
}

// --- Función para mostrar errores ---
function mostrarError(mensaje) {
  const errorDiv = document.getElementById("loginError");
  errorDiv.textContent = mensaje;
  setTimeout(() => errorDiv.textContent = "", 4000);
}

// --- Función para cargar solicitudes pendientes ---
function cargarSolicitudes() {
  fetch(`${API_URL}?action=obtenerSolicitudesPendientes`)
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById("solicitudesTable").querySelector("tbody");
      tbody.innerHTML = "";
      data.forEach((solicitud, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${solicitud.nombre}</td>
          <td>${solicitud.rut}</td>
          <td>${solicitud.correo}</td>
          <td>
            <button onclick="aceptarSolicitud('${solicitud.rut}')">Aceptar</button>
            <button onclick="rechazarSolicitud('${solicitud.rut}')">Rechazar</button>
          </td>
        `;

        tbody.appendChild(row);
      });
    })
    .catch(error => console.error("Error cargando solicitudes:", error));
}

// --- Función para aceptar solicitud ---
function aceptarSolicitud(rutSolicitado) {
  const fechaFin = prompt("Ingrese la Fecha de Vencimiento de Licencia Roja (YYYY-MM-DD):");
  if (!fechaFin) return alert("Debe ingresar una fecha.");

  fetch(`${API_URL}?action=gestionarSolicitud`, {
    method: "POST",
    body: JSON.stringify({
      rutSolicitado,
      decision: "Aceptado",
      fechaFin,
      rutInstructor
    }),
    headers: { "Content-Type": "application/json" }
  })
  .then(() => {
    alert("Solicitud aceptada exitosamente.");
    cargarSolicitudes();
  })
  .catch(error => console.error("Error aceptando solicitud:", error));
}

// --- Función para rechazar solicitud ---
function rechazarSolicitud(rutSolicitado) {
  if (!confirm("¿Seguro que desea rechazar esta solicitud?")) return;

  fetch(`${API_URL}?action=gestionarSolicitud`, {
    method: "POST",
    body: JSON.stringify({
      rutSolicitado,
      decision: "Rechazado",
      fechaFin: "", // no se usa fecha
      rutInstructor
    }),
    headers: { "Content-Type": "application/json" }
  })
  .then(() => {
    alert("Solicitud rechazada exitosamente.");
    cargarSolicitudes();
  })
  .catch(error => console.error("Error rechazando solicitud:", error));
}

// --- Función para cargar informe personal del instructor ---
function cargarInformePersonal(rut) {
  fetch(`${API_URL}?action=obtenerInforme&rut=${encodeURIComponent(rut)}`)
    .then(response => response.json())
    .then(data => {
      if (!data) return;

      document.getElementById("vecesIngresado").textContent = data.vecesIngresado;
      document.getElementById("puntajeMaximo").textContent = data.puntajeMaximo;
      document.getElementById("primerIntento").textContent = data.primerIntento;
      document.getElementById("ultimoIntento").textContent = data.ultimoIntento;

      dibujarGrafico(data.historial);
    })
    .catch(error => console.error("Error cargando informe:", error));
}

// --- Función para dibujar el gráfico de evolución ---
function dibujarGrafico(historial) {
  const ctx = document.getElementById("graficoEvolucion").getContext("2d");
  if (window.graficoEvolucion) window.graficoEvolucion.destroy(); // destruir gráfico previo

  window.graficoEvolucion = new Chart(ctx, {
    type: 'line',
    data: {
      labels: historial.map(h => h.fecha),
      datasets: [{
        label: 'Puntaje',
        data: historial.map(h => h.puntaje),
        fill: false,
        borderColor: 'blue',
        tension: 0.1
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Fecha' } },
        y: { title: { display: true, text: 'Puntaje' }, suggestedMin: 0, suggestedMax: 100 }
      }
    }
  });
}

// --- Función para buscar alumnos ---
function buscarAlumno() {
  const criterio = document.getElementById("busquedaInput").value.trim();
  if (!criterio) return alert("Ingrese un nombre, apellido o RUT para buscar.");

  fetch(`${API_URL}?action=buscarAlumno&criterio=${encodeURIComponent(criterio)}`)
    .then(response => response.json())
    .then(data => {
      const contenedor = document.getElementById("resultadosBusqueda");
      contenedor.innerHTML = "";

      if (data.length === 0) {
        contenedor.innerHTML = "<p>No se encontraron coincidencias.</p>";
        return;
      }

      data.forEach(alumno => {
        const div = document.createElement("div");
        div.classList.add("resultado-alumno");
        div.innerHTML = `
          <p><strong>Nombre:</strong> ${alumno.nombre}</p>
          <p><strong>RUT:</strong> ${alumno.rut}</p>
          <button onclick="cargarInformePersonal('${alumno.rut}')">Ver Informe</button>
          <hr>
        `;
        contenedor.appendChild(div);
      });
    })
    .catch(error => console.error("Error en búsqueda:", error));
}

