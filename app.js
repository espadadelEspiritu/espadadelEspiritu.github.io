// ==============================
// 🔥 ESTADO GLOBAL DE LA APP
// ==============================

let ventaActual = []; // productos actuales en la venta
let totalVenta = 0;   // total de la venta actual
let historial = JSON.parse(localStorage.getItem("ventas")) || []; // ventas guardadas


// ==============================
// 🎯 ELEMENTOS DEL DOM
// ==============================

const modal = document.getElementById("modal");
const input = document.getElementById("inputProducto");
const preview = document.getElementById("preview");

const totalVentaSpan = document.getElementById("totalVenta");
const totalDiaSpan = document.getElementById("totalDia");

const listaVentas = document.getElementById("listaVentas");

const preVenta = document.getElementById("preVenta"); // 🔥 NUEVO


// ==============================
// 🚀 INICIALIZAR APP
// ==============================

function init() {
  renderHistorial(); // (si lo tienes en otro lado)
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
  let multiplicar = false;

  // Si solo hay un número → es precio
  if (nums.length === 1) {
    precio = nums[0];
  }

  // Si hay dos o más → cantidad x precio
  if (nums.length >= 2) {
    cantidad = nums[0];
    precio = nums[1];
    multiplicar = true;
  }

  return { texto, cantidad, precio, multiplicar };
}


// ==============================
// 👀 PREVIEW EN TIEMPO REAL
// ==============================

input.addEventListener("input", () => {
  const val = input.value.trim();
  if (!val) return preview.textContent = "";

  const d = parsear(val);

  // Solo mostrar cuando hay multiplicación (evita ruido visual)
  if (!d.multiplicar) {
    preview.textContent = "";
    return;
  }

  preview.textContent = `${d.cantidad} x ${d.precio} = $${d.cantidad * d.precio}`;
});


// ==============================
// ➕ AGREGAR PRODUCTO (ENTER)
// ==============================

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {

    const val = input.value.trim();
    if (!val) return;

    const d = parsear(val);
    if (!d.precio) return;

    const subtotal = d.multiplicar ? d.cantidad * d.precio : d.precio;

    // 🔥 agregar ID único para poder editar/eliminar correctamente
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

    renderPreVenta(); // 🔥 refresca lista editable
  }
});


// ==============================
// 🧾 RENDER PRE-VENTA (NUEVO)
// ==============================

function renderPreVenta() {

  preVenta.innerHTML = ""; // limpia lista

  ventaActual.forEach((item, index) => {

    const div = document.createElement("div");

    div.className = "flex justify-between bg-gray-100 p-2 rounded text-sm";

    div.innerHTML = `
      <span>${item.texto}</span>

      <div class="flex gap-2 items-center">

        <span>$${item.subtotal}</span>

        <!-- ✏️ EDITAR -->
        <button class="text-blue-500">✏️</button>

        <!-- 🗑 ELIMINAR -->
        <button class="text-red-500">🗑</button>

      </div>
    `;

    // 🗑 eliminar
    div.querySelector(".text-red-500").onclick = () => {
      eliminarItem(index);
    };

    // ✏️ editar (regresa al input y elimina temporalmente)
    div.querySelector(".text-blue-500").onclick = () => {
      editarItem(index);
    };

    preVenta.appendChild(div);
  });
}


// ==============================
// 🗑 ELIMINAR PRODUCTO
// ==============================

function eliminarItem(index) {
  totalVenta -= ventaActual[index].subtotal;
  ventaActual.splice(index, 1);

  actualizarTotalVenta();
  renderPreVenta();
}


// ==============================
// ✏️ EDITAR PRODUCTO
// ==============================

function editarItem(index) {

  const item = ventaActual[index];

  // regresa texto al input
  input.value = item.texto;

  // lo elimina para poder re-agregarlo corregido
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

  historial.push(venta);
  localStorage.setItem("ventas", JSON.stringify(historial));

  renderVenta(venta);

  resetVenta();
  modal.close();
};


// ==============================
// 📊 TOTALES
// ==============================

function actualizarTotalVenta() {
  totalVentaSpan.textContent = "$" + totalVenta;
}

function actualizarTotalDia() {
  const total = historial.reduce((acc, v) => acc + v.total, 0);
  totalDiaSpan.textContent = "$" + total;
}


// ==============================
// 🔄 RESET DE VENTA (FIX IMPORTANTE)
// ==============================

function resetVenta() {
  ventaActual = [];
  totalVenta = 0;

  actualizarTotalVenta();

  input.value = "";
  preview.textContent = "";

  renderPreVenta(); // limpia UI
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
// 📄 PDF (sin cambios)
// ==============================

document.getElementById("btnPDF").onclick = () => {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  historial.forEach((v, i) => {

    doc.text(`Venta ${i + 1}`, 10, y);
    y += 6;

    v.items.forEach(it => {
      doc.text(`${it.texto} - $${it.subtotal}`, 10, y);
      y += 6;
    });

    doc.text(`Total: $${v.total}`, 10, y);
    y += 10;
  });

  doc.text(`TOTAL DEL DIA: $${totalDiaSpan.textContent}`, 10, y + 10);

  doc.save("reporte.pdf");
};
