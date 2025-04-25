
function validarYMostrar(){
  const rut = document.getElementById('rut').value.trim();
  if(!rut) return alert('Ingresa tu RUT primero.');
  google.script.run.withSuccessHandler(respuestaValidacion).validarAccesoInforme(rut);
}

function respuestaValidacion(res){
  if(res.autorizado){
    alert(`Acceso autorizado. Bienvenido(a), ${res.nombre}.`);
    obtenerInforme();
  } else {
    alert('No tienes acceso a este informe.');
  }
}

function obtenerInforme(){
  const rut = document.getElementById('rut').value.trim();
  google.script.run.withSuccessHandler(mostrarInforme).obtenerInforme(rut);
}

function mostrarInforme(data){
  if(!data){
    document.getElementById('resultado').innerHTML = "No existen registros para este RUT.";
    return;
  }

  document.getElementById('resultado').innerHTML = `
    <strong>Veces que ingresó:</strong> ${data.vecesIngresado}<br>
    <strong>Puntaje Máximo:</strong> ${data.puntajeMaximo}<br>
    <strong>Primer Intento:</strong> ${data.primerIntento}<br>
    <strong>Último Intento:</strong> ${data.ultimoIntento}
  `;

  const ctx = document.getElementById('grafico').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.historial.map(h=>h.fecha),
      datasets: [{
        label: 'Puntaje obtenido',
        data: data.historial.map(h=>h.puntaje),
        borderColor: '#4CAF50',
        fill: false,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {beginAtZero: true, max: 100}
      }
    }
  });
}
