let ventaActual = [];
let totalVenta = 0;
let historial = JSON.parse(localStorage.getItem("ventas")) || [];



const modal = document.getElementById("modal");
const input = document.getElementById("inputProducto");
const preview = document.getElementById("preview");

const totalVentaSpan = document.getElementById("totalVenta");
const totalDiaSpan = document.getElementById("totalDia");

const listaVentas = document.getElementById("listaVentas");




function init() {
  renderHistorial();
  actualizarTotalDia();
  modal.showModal();
}

init();




function parsear(texto) {
  const nums = texto.match(/\d+(\.\d+)?/g)?.map(Number) || [];

  let cantidad = 1;
  let precio = 0;
  let multiplicar = false;

  if (nums.length === 1) {
    precio = nums[0];
  }

  if (nums.length >= 2) {
    cantidad = nums[0];
    precio = nums[1];
    multiplicar = true;
  }

  return { texto, cantidad, precio, multiplicar };
}





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






input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {

    const val = input.value.trim();
    if (!val) return;

    const d = parsear(val);
    if (!d.precio) return;

    const subtotal = d.multiplicar ? d.cantidad * d.precio : d.precio;

    const item = { ...d, subtotal };
    ventaActual.push(item);

    totalVenta += subtotal;
    actualizarTotalVenta();

    input.value = "";
    preview.textContent = "";
  }
});




function eliminarItem(index) {
  totalVenta -= ventaActual[index].subtotal;
  ventaActual.splice(index, 1);
  actualizarTotalVenta();
}




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






function actualizarTotalVenta() {
  totalVentaSpan.textContent = "$" + totalVenta;
}

function actualizarTotalDia() {
  const total = historial.reduce((acc, v) => acc + v.total, 0);
  totalDiaSpan.textContent = "$" + total;
}





function resetVenta() {
  ventaActual = [];
  totalVenta = 0;
  actualizarTotalVenta();
  input.value = "";
  preview.textContent = "";
}





document.getElementById("btnNuevaVenta").onclick = () => {
  resetVenta();
  modal.showModal();
};

document.getElementById("btnCerrar").onclick = () => {
  modal.close();
};






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











