const LOGIN_URL = "https://script.google.com/macros/s/AKfycbwJMqJt9e5Th-9BSS8YlXvlpQGkqovlJY-esGeShTKhroLfT-xibzQlaQMZj0m7XHLV/exec";

// Limpia el RUT (quita puntos y guión)
function limpiarRUT(rut) {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

// Valida el RUT chileno (con dígito verificador)
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

// Al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const rutInput = document.getElementById("rut");
      const mensaje = document.getElementById("mensaje");
      const rut = limpiarRUT(rutInput.value.trim());

      mensaje.textContent = "";

      if (!validarRUT(rut)) {
        mensaje.textContent = "RUT inválido. Verifique el formato.";
        return;
      }

      mensaje.textContent = "Validando...";

      try {
        const res = await fetch(`${LOGIN_URL}?rut=${encodeURIComponent(rut)}`);
        const text = (await res.text()).trim();

        if (text === "OK") {
          localStorage.setItem("rut_instructor", rut);
          window.location.href = "informe.html";
        } else {
          mensaje.textContent = "Acceso denegado. RUT no autorizado.";
        }
      } catch (error) {
        console.error("Error al validar:", error);
        mensaje.textContent = "Error al validar. Intente más tarde.";
      }
    });
  }
});
