const LOGIN_URL = "https://script.google.com/macros/s/AKfycbwiZy2sj0UupFMis3UCSHc72bj9Jj5Xje82IDopOxBT-2xxE0RbplnMrRWho9IVu1SI/exec";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const rut = document.getElementById("rut").value.trim();
      const mensaje = document.getElementById("mensaje");
      mensaje.textContent = "";

      if (rut.length < 7) {
        mensaje.textContent = "RUT inválido. Intente nuevamente.";
        return;
      }

      // Validación mediante imagen invisible (evita CORS)
      const img = new Image();
      img.onload = () => {
        localStorage.setItem("rut_instructor", rut);
        window.location.href = "informe.html";
      };
      img.onerror = () => {
        mensaje.textContent = "Acceso denegado. No está autorizado.";
      };
      img.src = `${LOGIN_URL}?rut=${rut}&t=${Date.now()}`; // Agrega t para evitar caché
    });
  }
});
