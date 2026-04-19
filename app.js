// ======================================================
// 🔥 SISTEMA POS VENDIBLE - VERSION ESTABLE
// ======================================================

// ==============================
// 📦 ESTADO GLOBAL
// ==============================

// usuario logueado por PIN
let usuarioActual = null;

// venta en curso
let ventaActual = [];
let totalVenta = 0;

// base de datos local (todas las ventas por usuario)
let data = JSON.parse(localStorage.getItem("dataPOS")) || {};


// ==============================
// 🎯 ELEMENTOS DEL DOM
// ==============================

const modal = document.getElementById("modal");
const input = document.getElementById("inputProducto");
const preview = document.getElementById("preview");

const totalVentaSpan = document.getElementById("totalVenta");
const totalDiaSpan = document.getElementById("totalDia");

const listaVentas = document.getElementById("listaVentas");


// ==============================
// 🔐 LOGIN POR PIN
// ==============================

document.getElementById("btnLogin").onclick = () => {

  const pin = document.getElementById("pinInput").value;

  if (!pin) return;

  usuarioActual = pin;

  // si no existe usuario lo creamos
  if (!data[pin]) {
    data[pin] = { ventas: [] };
  }

  // guardar sesión
  localStorage.setItem("usuarioActivo", pin);

  // ocultar login
  document.getElementById("loginScreen").style.display = "none";

  // cargar datos
  renderHistorial();
  actualizarTotalDia();
};


// ==============================
// 🚀 INICIALIZACIÓN
// ==============================

function init() {

  const savedUser = localStorage.getItem("usuarioActivo");

  if (savedUser) {
    usuarioActual = savedUser;
    document.getElementById("loginScreen").style.display = "none";
  }

  renderHistorial();
  actualizarTotalDia();

  modal.showModal();
}

init();


// ==============================
// 🧠 PARSER INTELIGENTE
// ==============================

function parsear(texto) {

  const nums = texto.match(/\d+(\.\d+)?/g)?.map(Number) || [];

  let cantidad = 1;
  let precio = 0;
  let multi = false;

  if (nums.length === 1) {
    precio = nums[0];
  }

  if (nums.length >= 2) {
    cantidad = nums[0];
    precio = nums[1];
    multi = true;
  }

  return { texto, cantidad, precio, multi };
}


// ==============================
// 👀 PREVIEW EN TIEMPO REAL
// ==============================

input.addEventListener("input", () => {

  const val = input.value.trim();
  if (!val) return preview.textContent = "";

  const d = parsear(val);

  if (!d.multi) {
    preview.textContent = "";
    return;
  }

  preview.textContent = `${d.cantidad} x ${d.precio} = $${d.cantidad * d.precio}`;
});


// ==============================
// ➕ AGREGAR PRODUCTO
// ==============================

input.addEventListener("keydown", (e) => {

  if (e.key !== "Enter") return;

  const val = input.value.trim();
  if (!val) return;

  const d = parsear(val);

  const subtotal = d.multi ? d.cantidad * d.precio : d.precio;

  const item = {
    id: Date.now(),
    ...d,
    subtotal
  };

  ventaActual.push(item);
  totalVenta += subtotal;

  actualizarTotalVenta();

  input.value = "";
  preview.textContent = "";

  renderPreVenta();
});


// ==============================
// 🧾 PREVIEW VENTA (MODAL)
// ==============================

function renderPreVenta() {

  const cont = document.getElementById("preVenta");
  if (!cont) return;

  cont.innerHTML = "";

  ventaActual.forEach((item, index) => {

    const div = document.createElement("div");

    div.className = "flex justify-between bg-gray-100 p-2 rounded";

    div.innerHTML = `
      <span>${item.texto}</span>

      <div class="flex gap-2 items-center">
        <span>$${item.subtotal}</span>

        <button class="text-blue-500">✏️</button>
        <button class="text-red-500">🗑</button>
      </div>
    `;

    // eliminar
    div.querySelector(".text-red-500").onclick = () => eliminarItem(index);

    // editar
    div.querySelector(".text-blue-500").onclick = () => editarItem(index);

    cont.appendChild(div);
  });
}


// ==============================
// 🗑 ELIMINAR
// ==============================

function eliminarItem(index) {

  totalVenta -= ventaActual[index].subtotal;
  ventaActual.splice(index, 1);

  actualizarTotalVenta();
  renderPreVenta();
}


// ==============================
// ✏️ EDITAR
// ==============================

function editarItem(index) {

  input.value = ventaActual[index].texto;

  eliminarItem(index);
}


// ==============================
// 💰 FINALIZAR VENTA
// ==============================

document.getElementById("btnFinalizar").onclick = () => {

  if (!ventaActual.length) return;

  const venta = {
    items: ventaActual,
    total: totalVenta,
    fecha: new Date().toLocaleString()
  };

  data[usuarioActual].ventas.push(venta);

  localStorage.setItem("dataPOS", JSON.stringify(data));

  renderVenta(venta);

  resetVenta();
  modal.close();
};


// ==============================
// 📊 TOTAL VENTA ACTUAL
// ==============================

function actualizarTotalVenta() {
  totalVentaSpan.textContent = "$" + totalVenta;
}


// ==============================
// 📊 TOTAL DEL DÍA (ARREGLADO)
// ==============================

function actualizarTotalDia() {

  if (!usuarioActual) return;

  const ventas = data[usuarioActual]?.ventas || [];

  const total = ventas.reduce((acc, v) => acc + v.total, 0);

  totalDiaSpan.textContent = "$" + total;
}


// ==============================
// 🔄 RESET
// ==============================

function resetVenta() {

  ventaActual = [];
  totalVenta = 0;

  actualizarTotalVenta();

  input.value = "";
  preview.textContent = "";

  renderPreVenta();
}


// ==============================
// 🆕 NUEVA VENTA
// ==============================

document.getElementById("btnNuevaVenta").onclick = () => {
  resetVenta();
  modal.showModal();
};


// ==============================
// ❌ CERRAR MODAL
// ==============================

document.getElementById("btnCerrar").onclick = () => {
  modal.close();
};


// ==============================
// 📦 RENDER VENTAS
// ==============================

function renderVenta(v) {

  const div = document.createElement("div");

  div.className = "bg-yellow-100 p-4 rounded shadow";

  let items = v.items.map(i => `
    <div class="flex justify-between text-sm">
      <span>${i.texto}</span>
      <span>$${i.subtotal}</span>
    </div>
  `).join("");

  div.innerHTML = `
    <div class="font-bold mb-2">Venta</div>
    ${items}
    <hr class="my-2">

    <div class="flex justify-between font-bold">
      <span>Total</span>
      <span>$${v.total}</span>
    </div>

    <!-- 🔥 BOTÓN WHATSAPP -->
    <button class="mt-2 bg-green-500 text-white px-3 py-1 rounded flex items-center gap-2">
      <i class="bi bi-whatsapp"></i> Compartir
    </button>
  `;

  // WhatsApp share
  div.querySelector("button").onclick = () => {

    const msg = `Venta: $${v.total}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  listaVentas.prepend(div);
}


// ==============================
// 📄 PDF DEL DÍA (BOTÓN YA EN FOOTER)
// ==============================

document.getElementById("btnPDF").onclick = () => {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  const ventas = data[usuarioActual]?.ventas || [];

  ventas.forEach((v, i) => {

    doc.text(`Venta ${i + 1}`, 10, y);
    y += 6;

    v.items.forEach(it => {
      doc.text(`${it.texto} - $${it.subtotal}`, 10, y);
      y += 6;
    });

    doc.text(`Total: $${v.total}`, 10, y);
    y += 10;
  });

  doc.text(`TOTAL DEL DÍA: $${totalDiaSpan.textContent}`, 10, y + 10);

  doc.save("reporte.pdf");
};


// ==============================
// 📊 RENDER HISTORIAL
// ==============================

function renderHistorial() {

  listaVentas.innerHTML = "";

  const ventas = data[usuarioActual]?.ventas || [];

  ventas.forEach(renderVenta);
}
