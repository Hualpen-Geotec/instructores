// URL del archivo CSV de instructores en GitHub
const CSV_URL = "https://raw.githubusercontent.com/Hualpen-Geotec/instructores/main/instructores.csv";

// Función para limpiar el RUT (eliminar puntos y guiones)
function limpiarRUT(rut) {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

// Función para validar el RUT chileno
function validarRUT(rut) {
  if (!/^\d{7,8}[0-9K]$/.test(rut)) return false;

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();
  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

  return dv === dvCalculado;
}

// Función para cargar y parsear el CSV de instructores
async function cargarInstructores() {
  try {
    const response = await fetch(CSV_URL);
    const texto = await response.text();
    const lineas = texto.trim().split("\n");
    const instructores = new Map();

    for (const linea of lineas) {
      const [rut, nombre] = linea.split(",").map(campo => campo.trim());
      if (rut && nombre) {
        instructores.set(limpiarRUT(rut), nombre);
      }
    }

    return instructores;
  } catch (error) {
    console.error("Error al cargar el archivo CSV:", error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const rutInput = document.getElementById("rut");
      const mensaje = document.getElementById("mensaje");
      const rutIngresado = limpiarRUT(rutInput.value.trim());

      mensaje.textContent = "";

      if (!validarRUT(rutIngresado)) {
        mensaje.textContent = "RUT inválido. Verifique el formato.";
        return;
      }

      mensaje.textContent = "Validando...";

      const instructores = await cargarInstructores();

      if (!instructores) {
        mensaje.textContent = "Error al cargar la lista de instructores. Intente más tarde.";
        return;
      }

      if (instructores.has(rutIngresado)) {
        localStorage.setItem("rut_instructor", rutIngresado);
        window.location.href = "informe.html";
      } else {
        mensaje.textContent = "Acceso denegado. No está autorizado.";
      }
    });
  }
});
