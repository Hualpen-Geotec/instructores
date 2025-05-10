
const LOGIN_URL = "https://script.google.com/macros/s/AKfycbwiZy2sj0UupFMis3UCSHc72bj9Jj5Xje82IDopOxBT-2xxE0RbplnMrRWho9IVu1SI/exec";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const rut = document.getElementById("rut").value.trim();
      const mensaje = document.getElementById("mensaje");
      mensaje.textContent = "";

      if (rut.length < 7) {
        mensaje.textContent = "RUT inválido. Intente nuevamente.";
        return;
      }

      try {
        const res = await fetch(`${LOGIN_URL}?rut=${rut}`);
        const data = await res.json();

        if (data.autorizado) {
          localStorage.setItem("rut_instructor", rut);
          window.location.href = "informe.html";
        } else {
          mensaje.textContent = "Acceso denegado. No está autorizado.";
        }
      } catch (error) {
        mensaje.textContent = "Error de conexión. Intente más tarde.";
        console.error(error);
      }
    });
  }
});
