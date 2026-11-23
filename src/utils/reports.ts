import type { Order, AdCampaign } from "@/types/store";
import { AD_SPACE_LABELS } from "@/types/store";

const fmt = (p: number) =>
  new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(p);

const today = () => new Date().toLocaleDateString("pt-MZ");

/* ─── Partner Revenue Report (excludes delivery fees) ─── */
export const generatePartnerRevenueReport = (
  orders: Order[],
  suppliers: { id: string; name: string }[],
  detailed: boolean,
  filterSupplierId?: string
): string => {
  const validOrders = orders.filter((o) => ["payment-verified", "shipped", "delivered"].includes(o.status));

  const supplierMap = new Map<string, { name: string; revenue: number; iva: number; orders: Order[] }>();

  validOrders.forEach((order) => {
    order.items.forEach((item) => {
      const sid = item.product.supplierId;
      if (filterSupplierId && sid !== filterSupplierId) return;
      const supplier = suppliers.find((s) => s.id === sid);
      const existing = supplierMap.get(sid) || { name: supplier?.name || "Desconhecido", revenue: 0, iva: 0, orders: [] };
      const itemTotal = item.product.price * item.quantity;
      existing.revenue += itemTotal;
      if (!existing.orders.find((o) => o.id === order.id)) existing.orders.push(order);
      supplierMap.set(sid, existing);
    });
  });

  const totalProductRevenue = Array.from(supplierMap.values()).reduce((s, d) => s + d.revenue, 0);
  const totalIva = totalProductRevenue * 0.16;

  const filterName = filterSupplierId ? suppliers.find((s) => s.id === filterSupplierId)?.name : undefined;

  let detailRows = "";
  if (detailed) {
    Array.from(supplierMap.entries()).forEach(([, data]) => {
      data.orders.forEach((order) => {
        const supplierItems = order.items.filter((i) => !filterSupplierId || i.product.supplierId === filterSupplierId);
        supplierItems.forEach((item) => {
          detailRows += `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px">${order.id}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px">${new Date(order.createdAt).toLocaleDateString("pt-MZ")}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px">${data.name}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px">${item.product.name}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;text-align:center">${item.quantity}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;text-align:right">${fmt(item.product.price * item.quantity)}</td>
          </tr>`;
        });
      });
    });
  }

  const summaryRows = Array.from(supplierMap.entries())
    .map(([, data]) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee">${data.name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center">${data.orders.length}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${fmt(data.revenue)}</td>
      </tr>`)
    .join("");

  return buildReportHTML({
    title: detailed ? "Relatório Detalhado de Receitas" : "Relatório Simplificado de Receitas",
    subtitle: filterName ? `Relatório para: ${filterName}` : "Receitas por Parceiro (excl. transporte)",
    date: today(),
    body: `
      ${filterName ? `<p style="font-size:14px;color:#16a34a;font-weight:600;margin-bottom:16px">Beneficiário: ${filterName}</p>` : ""}
      <p style="font-size:13px;color:#666;margin-bottom:20px">
        <strong>Nota:</strong> Os valores de transporte/entrega não estão incluídos neste relatório.
      </p>
      <h3 style="font-size:14px;margin-bottom:10px">Resumo por Parceiro</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead><tr style="background:#f5f5f5">
          <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;color:#666">Parceiro</th>
          <th style="padding:8px 10px;text-align:center;font-size:11px;text-transform:uppercase;color:#666">Encomendas</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;text-transform:uppercase;color:#666">Receita Produtos</th>
        </tr></thead>
        <tbody>${summaryRows}</tbody>
        <tfoot><tr style="border-top:2px solid #333">
          <td style="padding:10px;font-weight:700">Total</td>
          <td style="padding:10px;text-align:center;font-weight:700">${Array.from(supplierMap.values()).reduce((s, d) => s + d.orders.length, 0)}</td>
          <td style="padding:10px;text-align:right;font-weight:700;color:#16a34a">${fmt(totalProductRevenue)}</td>
        </tr></tfoot>
      </table>
      <p style="font-size:12px;color:#666">IVA Total Estimado: <strong>${fmt(totalIva)}</strong></p>
      ${detailed ? `<h3 style="font-size:14px;margin:24px 0 10px">Detalhe por Transacção</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f5f5f5">
            <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Encomenda</th>
            <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Data</th>
            <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Parceiro</th>
            <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Produto</th>
            <th style="padding:6px 10px;text-align:center;font-size:10px;text-transform:uppercase;color:#666">Qtd</th>
            <th style="padding:6px 10px;text-align:right;font-size:10px;text-transform:uppercase;color:#666">Valor</th>
          </tr></thead>
          <tbody>${detailRows}</tbody>
        </table>` : ""}`,
  });
};

/* ─── Ad Revenue Report ─── */
export const generateAdRevenueReport = (adCampaigns: AdCampaign[], filterPartner?: string): string => {
  const filtered = filterPartner ? adCampaigns.filter((a) => a.partner === filterPartner) : adCampaigns;
  const totalExpected = filtered.reduce((s, a) => s + a.expectedRevenue, 0);
  const totalRealized = filtered.reduce((s, a) => s + a.realizedRevenue, 0);
  const totalImpressions = filtered.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = filtered.reduce((s, a) => s + a.clicks, 0);

  const partnerMap = new Map<string, { campaigns: AdCampaign[]; expected: number; realized: number }>();
  filtered.forEach((a) => {
    const p = partnerMap.get(a.partner) || { campaigns: [], expected: 0, realized: 0 };
    p.campaigns.push(a);
    p.expected += a.expectedRevenue;
    p.realized += a.realizedRevenue;
    partnerMap.set(a.partner, p);
  });

  const partnerRows = Array.from(partnerMap.entries())
    .map(([name, data]) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee">${name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center">${data.campaigns.length}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right">${fmt(data.expected)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${fmt(data.realized)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right">${data.expected > 0 ? Math.round((data.realized / data.expected) * 100) : 0}%</td>
      </tr>`)
    .join("");

  const campaignRows = filtered
    .map((a) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px">${a.title}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px">${a.partner}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px">${AD_SPACE_LABELS[a.space]}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px">${a.startDate} → ${a.endDate || "∞"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;text-align:right">${fmt(a.expectedRevenue)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;text-align:right;font-weight:600">${fmt(a.realizedRevenue)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;text-align:center">${a.impressions.toLocaleString()}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;text-align:center">${a.clicks.toLocaleString()}</td>
      </tr>`)
    .join("");

  return buildReportHTML({
    title: "Relatório de Receitas Publicitárias",
    subtitle: filterPartner ? `Relatório para: ${filterPartner}` : "Campanhas e espaços publicitários",
    date: today(),
    body: `
      ${filterPartner ? `<p style="font-size:14px;color:#16a34a;font-weight:600;margin-bottom:16px">Beneficiário: ${filterPartner}</p>` : ""}
      <div style="display:flex;gap:20px;margin-bottom:24px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px;background:#f0fdf4;border-radius:8px;padding:16px">
          <p style="font-size:11px;color:#666;margin:0">Receita Prevista</p>
          <p style="font-size:20px;font-weight:700;margin:4px 0 0;color:#16a34a">${fmt(totalExpected)}</p>
        </div>
        <div style="flex:1;min-width:140px;background:#f0fdf4;border-radius:8px;padding:16px">
          <p style="font-size:11px;color:#666;margin:0">Receita Realizada</p>
          <p style="font-size:20px;font-weight:700;margin:4px 0 0;color:#16a34a">${fmt(totalRealized)}</p>
        </div>
        <div style="flex:1;min-width:140px;background:#f8f8f8;border-radius:8px;padding:16px">
          <p style="font-size:11px;color:#666;margin:0">Impressões</p>
          <p style="font-size:20px;font-weight:700;margin:4px 0 0">${totalImpressions.toLocaleString()}</p>
        </div>
        <div style="flex:1;min-width:140px;background:#f8f8f8;border-radius:8px;padding:16px">
          <p style="font-size:11px;color:#666;margin:0">Cliques</p>
          <p style="font-size:20px;font-weight:700;margin:4px 0 0">${totalClicks.toLocaleString()}</p>
        </div>
      </div>

      <h3 style="font-size:14px;margin-bottom:10px">Resumo por Parceiro</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead><tr style="background:#f5f5f5">
          <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;color:#666">Parceiro</th>
          <th style="padding:8px 10px;text-align:center;font-size:11px;text-transform:uppercase;color:#666">Campanhas</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;text-transform:uppercase;color:#666">Prevista</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;text-transform:uppercase;color:#666">Realizada</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;text-transform:uppercase;color:#666">Execução</th>
        </tr></thead>
        <tbody>${partnerRows}</tbody>
      </table>

      <h3 style="font-size:14px;margin-bottom:10px">Detalhe por Campanha</h3>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f5f5f5">
          <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Campanha</th>
          <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Parceiro</th>
          <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Espaço</th>
          <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Período</th>
          <th style="padding:6px 10px;text-align:right;font-size:10px;text-transform:uppercase;color:#666">Prevista</th>
          <th style="padding:6px 10px;text-align:right;font-size:10px;text-transform:uppercase;color:#666">Realizada</th>
          <th style="padding:6px 10px;text-align:center;font-size:10px;text-transform:uppercase;color:#666">Impr.</th>
          <th style="padding:6px 10px;text-align:center;font-size:10px;text-transform:uppercase;color:#666">Cliques</th>
        </tr></thead>
        <tbody>${campaignRows}</tbody>
      </table>`,
  });
};

/* ─── Shared HTML wrapper ─── */
function buildReportHTML(opts: { title: string; subtitle: string; date: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${opts.title}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none; } }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; max-width: 900px; margin: 0 auto; padding: 40px 30px; font-size: 13px; }
    h1 { font-size: 22px; margin: 0; }
    h3 { color: #333; }
    table { font-size: 13px; }
    .btn { display: inline-block; padding: 10px 28px; background: #16a34a; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin-right: 8px; text-decoration: none; }
    .btn:hover { background: #15803d; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:20px">
    <button class="btn" onclick="window.print()">⬇ Descarregar PDF</button>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #16a34a;padding-bottom:16px;margin-bottom:30px">
    <div>
      <h1>${opts.title}</h1>
      <p style="color:#666;margin:4px 0 0">${opts.subtitle}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:20px;font-weight:800;color:#16a34a;margin:0">DrOnline</p>
      <p style="font-size:11px;color:#999;margin:4px 0 0">Gerado em ${opts.date}</p>
    </div>
  </div>
  ${opts.body}
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#999">
    <p>Relatório gerado automaticamente por DrOnline • ${opts.date}</p>
  </div>
</body>
</html>`;
}

export const openReport = (html: string) => {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
