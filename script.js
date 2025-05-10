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
        const res = await fetch(`${LOGIN_URL}?rut=${rut}&t=${Date.now()}`);
        const text = await res.text();

        if (text.trim() === "OK") {
          localStorage.setItem("rut_instructor", rut);
          window.location.href = "informe.html";
        } else {
          mensaje.textContent = "Acceso denegado. No está autorizado.";
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        mensaje.textContent = "Error al validar el RUT. Intenta más tarde.";
      }
    });
  }
});
