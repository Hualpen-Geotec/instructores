const API_URL = 'https://script.google.com/macros/s/AKfycbzpe1sCH9zcREDq8M12VV2q5C3KpnibWyKHASWiPKVEGJnnG-qffAL7QeaTiDOrs-r87A/exec';

let rutInstructor = '';
let nombreInstructor = '';

async function validarInstructor() {
  const rut = document.getElementById('rutInput').value.trim();
  const res = await fetch(`${API_URL}?action=validarAccesoInforme&rut=${rut}`);
  const data = await res.json();
  
  if (data.autorizado) {
    rutInstructor = rut;
    nombreInstructor = data.nombre;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('contenido').style.display = 'block';
    document.getElementById('bienvenida').innerText = `Bienvenido Instructor: ${nombreInstructor}`;
    cargarSolicitudes();
    cargarInformePersonal();
  } else {
    document.getElementById('mensajeLogin').innerText = 'Acceso denegado. RUT no autorizado.';
  }
}

async function cargarSolicitudes() {
  const res = await fetch(`${API_URL}?action=obtenerSolicitudes`);
  const solicitudes = await res.json();
  let html = '<table><tr><th>Nombre</th><th>RUT</th><th>Correo</th><th>Acción</th></tr>';
  
  solicitudes.forEach(solicitud => {
    html += `<tr>
      <td>${solicitud.nombre}</td>
      <td>${solicitud.rut}</td>
      <td>${solicitud.correo}</td>
      <td>
        <button onclick="gestionar('${solicitud.rut}','Aceptado')">Aceptar</button>
        <button onclick="gestionar('${solicitud.rut}','Rechazado')">Rechazar</button>
      </td>
    </tr>`;
  });
  html += '</table>';
  document.getElementById('tablaSolicitudes').innerHTML = html;
}

async function gestionar(rutSolicitado, decision) {
  if (decision === "Aceptado") {
    const fechaFin = prompt("Ingrese Fecha de Vencimiento de Licencia Roja (YYYY-MM-DD):");
    if (!fechaFin) return;
    
    await fetch(API_URL, {
      method: 'POST',
      body: new URLSearchParams({
        action: 'gestionarSolicitud',
        rutSolicitado,
        decision,
        fechaFin,
        rutInstructor
      })
    });
  } else {
    await fetch(API_URL, {
      method: 'POST',
      body: new URLSearchParams({
        action: 'gestionarSolicitud',
        rutSolicitado,
        decision,
        fechaFin: '',
        rutInstructor
      })
    });
  }
  
  alert(`Solicitud ${decision.toLowerCase()} correctamente.`);
  cargarSolicitudes();
}

async function cargarInformePersonal() {
  const res = await fetch(`${API_URL}?action=obtenerInforme&rut=${rutInstructor}`);
  const data = await res.json();
  mostrarInforme(data, 'informePersonal');
}

async function buscarAlumno() {
  const rut = document.getElementById('buscarRut').value.trim();
  const res = await fetch(`${API_URL}?action=obtenerInforme&rut=${rut}`);
  const data = await res.json();
  mostrarInforme(data, 'informeAlumno');
}

function mostrarInforme(data, idDiv) {
  if (!data) {
    document.getElementById(idDiv).innerHTML = '<p>No se encontraron datos.</p>';
    return;
  }
  
  const html = `
    <p>Veces ingresado: ${data.vecesIngresado}</p>
    <p>Nota más alta: ${data.puntajeMaximo}</p>
    <p>Primer intento: ${data.primerIntento}</p>
    <p>Último intento: ${data.ultimoIntento}</p>
    <canvas id="grafico-${idDiv}" width="400" height="200"></canvas>
  `;
  document.getElementById(idDiv).innerHTML = html;

  const ctx = document.getElementById(`grafico-${idDiv}`).getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.historial.map(p => p.fecha),
      datasets: [{
        label: 'Evolución de Puntajes',
        data: data.historial.map(p => p.puntaje),
        borderColor: 'orange',
        borderWidth: 2,
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

