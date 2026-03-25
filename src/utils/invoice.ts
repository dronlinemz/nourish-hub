import type { Order } from "@/types/store";
import { DELIVERY_ZONE_LABELS } from "@/types/store";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(price);

export const generateInvoiceHTML = (order: Order): string => {
  const itemsRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:left">${item.product.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.product.price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.product.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Factura ${order.id}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none; } }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 30px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #16a34a; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: 800; color: #16a34a; }
    .logo span { color: #1a1a1a; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { margin: 0 0 8px; font-size: 22px; color: #16a34a; }
    .invoice-info p { margin: 2px 0; font-size: 13px; color: #666; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party { flex: 1; }
    .party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
    .party p { margin: 2px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f8f8f8; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 2px solid #ddd; }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table tr td { padding: 6px 0; font-size: 14px; }
    .totals-table tr td:last-child { text-align: right; font-weight: 600; }
    .totals-table .grand-total td { border-top: 2px solid #1a1a1a; padding-top: 10px; font-size: 18px; font-weight: 800; color: #16a34a; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
    .btn-download { display: inline-block; padding: 12px 32px; background: #16a34a; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin: 20px auto; }
    .btn-download:hover { background: #15803d; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:20px">
    <button class="btn-download" onclick="window.print()">⬇ Descarregar Factura (PDF)</button>
  </div>

  <div class="header">
    <div>
      <div class="logo">Dr<span>Online</span></div>
      <p style="font-size:12px;color:#666;margin-top:4px">Marketplace de Saúde e Bem-Estar</p>
      <p style="font-size:11px;color:#999;margin-top:2px">NUIT: 400123456 • Maputo, Moçambique</p>
    </div>
    <div class="invoice-info">
      <h2>FACTURA</h2>
      <p><strong>Nº:</strong> ${order.id}</p>
      <p><strong>Data:</strong> ${new Date(order.createdAt).toLocaleDateString("pt-MZ")}</p>
      <p><strong>Pagamento:</strong> ${order.paymentMethod === "mpesa" ? "M-Pesa" : "Transferência Bancária"}</p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>Emitente</h3>
      <p><strong>DrOnline Lda</strong></p>
      <p>Av. 25 de Setembro, 1234</p>
      <p>Maputo, Moçambique</p>
      <p>Tel: +258 84 000 0000</p>
    </div>
    <div class="party" style="text-align:right">
      <h3>Cliente</h3>
      <p><strong>${order.customerName}</strong></p>
      <p>${order.customerAddress}</p>
      <p>Tel: ${order.customerPhone}</p>
      ${order.customerEmail ? `<p>${order.customerEmail}</p>` : ""}
      ${order.customerNuit ? `<p>NUIT: ${order.customerNuit}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descrição</th>
        <th>Qtd</th>
        <th>Preço Unit.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr><td>Subtotal</td><td>${formatPrice(order.subtotal)}</td></tr>
      <tr><td>IVA (16%)</td><td>${formatPrice(order.iva)}</td></tr>
      <tr><td>Entrega (${DELIVERY_ZONE_LABELS[order.deliveryZone]})</td><td>${formatPrice(order.deliveryFee)}</td></tr>
      <tr class="grand-total"><td>Total</td><td>${formatPrice(order.total)}</td></tr>
    </table>
  </div>

  <div class="footer">
    <p>Factura electrónica gerada automaticamente por DrOnline</p>
    <p>Este documento serve como comprovativo da sua encomenda</p>
    <p style="margin-top:8px">Obrigado pela sua compra!</p>
  </div>
</body>
</html>`;
};

export const downloadInvoice = (order: Order) => {
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `factura-${order.id}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
