const LOGIN\_URL = "[https://script.google.com/macros/s/AKfycbwiZy2sj0UupFMis3UCSHc72bj9Jj5Xje82IDopOxBT-2xxE0RbplnMrRWho9IVu1SI/exec](https://script.google.com/macros/s/AKfycbwiZy2sj0UupFMis3UCSHc72bj9Jj5Xje82IDopOxBT-2xxE0RbplnMrRWho9IVu1SI/exec)";

document.addEventListener("DOMContentLoaded", () => {
const loginForm = document.getElementById("loginForm");

if (loginForm) {
loginForm.addEventListener("submit", async function (e) {
e.preventDefault();

```
  const rutInput = document.getElementById("rut");
  const mensaje = document.getElementById("mensaje");
  const rut = rutInput.value.trim();

  mensaje.textContent = "";

  if (!validarRUT(rut)) {
    mensaje.textContent = "RUT inválido. Verifique el formato.";
    return;
  }

  mensaje.textContent = "Validando...";

  try {
    const res = await fetch(`${LOGIN_URL}?rut=${encodeURIComponent(rut)}&t=${Date.now()}`);
    const text = (await res.text()).trim();

    if (text === "OK") {
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
```

}
});

// Validación básica de RUT chileno (sin puntos ni guión)
function validarRUT(rut) {
if (!/^\d{7,8}\[0-9kK]{1}\$/.test(rut)) return false;

const cuerpo = rut.slice(0, -1);
let dv = rut.slice(-1).toUpperCase();
let suma = 0, multiplo = 2;

for (let i = cuerpo.length - 1; i >= 0; i--) {
suma += parseInt(cuerpo\[i]) \* multiplo;
multiplo = multiplo < 7 ? multiplo + 1 : 2;
}

let dvEsperado = 11 - (suma % 11);
dvEsperado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

return dv === dvEsperado;
}
