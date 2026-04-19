
// ======================================================
// 🔥 ESTADO GLOBAL (persistente en memoria del navegador)
// ======================================================

let ventaActual = []; // productos en venta activa
let totalVenta = 0;   // total actual de la venta
let historial = JSON.parse(localStorage.getItem("ventas")) || []; // historial guardado

// ======================================================
// 🎯 ELEMENTOS DEL DOM (control central de UI)
// ======================================================

const modal = document.getElementById("modal");
const input = document.getElementById("inputProducto");
const preview = document.getElementById("preview");

const totalVentaSpan = document.getElementById("totalVenta");
const totalDiaSpan = document.getElementById("totalDia");

const listaVentas = document.getElementById("listaVentas");

const preVenta = document.getElementById("preVenta"); // lista dentro del modal

// ======================================================
// 🚀 INICIO DE LA APP
// ======================================================

function init() {
  actualizarTotalDia(); // calcula total global
  modal.showModal();    // abre venta automáticamente (modo caja)
}

init();

// ======================================================
// 🧠 PARSER INTELIGENTE (detecta cantidad x precio)
// ======================================================

function parsear(texto) {

  const nums = texto.match(/\d+(\.\d+)?/g)?.map(Number) || [];

  let cantidad = 1;
  let precio = 0;
  let multiplicar = false;

  // caso: solo precio
  if (nums.length === 1) {
    precio = nums[0];
  }

  // caso: cantidad x precio
  if (nums.length >= 2) {
    cantidad = nums[0];
    precio = nums[1];
    multiplicar = true;
  }

  return { texto, cantidad, precio, multiplicar };
}

// ======================================================
// 👀 PREVIEW EN TIEMPO REAL (UX tipo caja)
// ======================================================

input.addEventListener("input", () => {

  const val = input.value.trim();
  if (!val) return preview.textContent = "";

  const d = parsear(val);

  if (!d.multiplicar) {
    preview.textContent = "";
    return;
  }

  preview.textContent = `${d.cantidad} x ${d.precio} = $${d.cantidad * d.precio}`;
});

// ======================================================
// ➕ AGREGAR PRODUCTO (ENTER)
// ======================================================

input.addEventListener("keydown", (e) => {

  if (e.key !== "Enter") return;

  const val = input.value.trim();
  if (!val) return;

  const d = parsear(val);
  if (!d.precio) return;

  const subtotal = d.multiplicar ? d.cantidad * d.precio : d.precio;

  const item = {
    id: Date.now(), // identificador único
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

// ======================================================
// 🧾 RENDER LISTA INTERNA (MODAL)
// ======================================================

function renderPreVenta() {

  if (!preVenta) return;

  preVenta.innerHTML = "";

  ventaActual.forEach((item, index) => {

    const div = document.createElement("div");

    div.className = "flex justify-between bg-gray-100 p-2 rounded text-sm";

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

    preVenta.appendChild(div);
  });
}

// ======================================================
// 🗑 ELIMINAR ITEM
// ======================================================

function eliminarItem(index) {

  totalVenta -= ventaActual[index].subtotal;
  ventaActual.splice(index, 1);

  actualizarTotalVenta();
  renderPreVenta();
}

// ======================================================
// ✏️ EDITAR ITEM
// ======================================================

function editarItem(index) {

  input.value = ventaActual[index].texto;

  eliminarItem(index);
}

// ======================================================
// 💰 FINALIZAR VENTA
// ======================================================

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

// ======================================================
// 📊 TOTALES
// ======================================================

function actualizarTotalVenta() {
  totalVentaSpan.textContent = "$" + totalVenta;
}

function actualizarTotalDia() {

  const total = historial.reduce((acc, v) => acc + v.total, 0);

  totalDiaSpan.textContent = "$" + total;
}

// ======================================================
// 🔄 RESET VENTA
// ======================================================

function resetVenta() {

  ventaActual = [];
  totalVenta = 0;

  actualizarTotalVenta();

  input.value = "";
  preview.textContent = "";

  renderPreVenta();
}

// ======================================================
// 🆕 NUEVA VENTA
// ======================================================

document.getElementById("btnNuevaVenta").onclick = () => {
  resetVenta();
  modal.showModal();
};

// ======================================================
// ❌ CERRAR MODAL
// ======================================================

document.getElementById("btnCerrar").onclick = () => {
  modal.close();
};

// ======================================================
// 📦 RENDER VENTA FINAL (CARD)
// ======================================================

function renderVenta(venta) {

  const div = document.createElement("div");

  div.className = "bg-yellow-100 p-4 rounded shadow";

  let items = venta.items.map(i => `
    <div class="flex justify-between text-sm">
      <span>${i.texto}</span>
      <span>$${i.subtotal}</span>
    </div>
  `).join("");

  div.innerHTML = `
    <div class="font-bold mb-2">Venta</div>
    ${items}
    <hr class="my-2">
    <div class="font-bold flex justify-between">
      <span>Total</span>
      <span>$${venta.total}</span>
    </div>
  `;

  listaVentas.prepend(div);
}

// ======================================================
// 📄 PDF DEL DÍA
// ======================================================

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
