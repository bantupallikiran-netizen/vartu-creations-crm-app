import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { calculateGrossMarginPercent, calculateProductCost, formatCurrency } from '../utils/calculations.ts';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  PieChart,
  ShoppingBag,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  Check,
  ChevronDown,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { orders, leads, quotations, customers, products, payments } = useCrm();
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const totalSales = orders.reduce((acc, o) => acc + (o.totalValue || 0), 0);
  const totalOrdersCount = orders.length;
  const aov = totalOrdersCount > 0 ? Math.round(totalSales / totalOrdersCount) : 0;

  const repeatCount = customers.filter((c) => c.totalOrders > 1).length;
  const repeatRate = customers.length > 0 ? Math.round((repeatCount / customers.length) * 100) : 0;

  const acceptedQuotations = quotations.filter((q) => q.status === 'Accepted').length;
  const quotationConversionRate =
    quotations.length > 0 ? Math.round((acceptedQuotations / quotations.length) * 100) : 0;

  const confirmedLeads = leads.filter((l) => l.status === 'Order Confirmed').length;
  const leadConversionRate = leads.length > 0 ? Math.round((confirmedLeads / leads.length) * 100) : 0;

  // Source breakdown
  const sourceStats: Record<string, { leads: number; orders: number; revenue: number }> = {};
  leads.forEach((l) => {
    if (!sourceStats[l.leadSource]) sourceStats[l.leadSource] = { leads: 0, orders: 0, revenue: 0 };
    sourceStats[l.leadSource].leads += 1;
    if (l.status === 'Order Confirmed') {
      sourceStats[l.leadSource].orders += 1;
      sourceStats[l.leadSource].revenue += l.expectedBudget || 1000;
    }
  });

  // Category breakdown
  const categoryStats: Record<string, number> = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const cat = prod?.category || 'Custom Handcrafted';
      categoryStats[cat] = (categoryStats[cat] || 0) + item.total;
    });
  });

  // Top products by margin
  const sortedProductsByMargin = [...products]
    .map((p) => {
      const cost = calculateProductCost(p.costing);
      const margin = calculateGrossMarginPercent(p.sellingPrice, cost);
      return { ...p, cost, margin };
    })
    .sort((a, b) => b.margin - a.margin);

  // Helper to escape and format CSV cells
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Helper to trigger CSV file download in browser
  const triggerCsvDownload = (filename: string, csvContent: string) => {
    try {
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice(`Exported ${filename}`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error('Failed to trigger CSV download:', err);
      setExportNotice('Failed to generate export file');
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  // 1. Export Full Sales & Orders Ledger
  const handleExportSalesOrdersCsv = () => {
    setIsExportMenuOpen(false);
    const dateStamp = new Date().toISOString().split('T')[0];
    const headers = [
      'Order Number',
      'Order Date',
      'Required Delivery',
      'Customer Name',
      'Customer Mobile',
      'Customer Email',
      'Delivery Address',
      'Order Type',
      'Priority',
      'Products Summary',
      'Total Items Count',
      'Total Order Value (INR)',
      'Advance Received (INR)',
      'Balance Due (INR)',
      'Payment Status',
      'Production Status',
      'Dispatch Status',
      'Order Status',
      'Customization / Notes',
    ];

    const rows = orders.map((o) => {
      const itemsSummary = o.items
        .map((it) => `${it.productName} (Qty: ${it.quantity}, Rate: ${it.unitPrice})`)
        .join('; ');
      const totalUnits = o.items.reduce((sum, it) => sum + (it.quantity || 0), 0);

      return [
        o.orderNumber,
        o.orderDate,
        o.requiredDeliveryDate,
        o.customerName,
        o.customerMobile,
        o.customerEmail || '',
        o.customerAddress || '',
        o.orderType,
        o.priority,
        itemsSummary,
        totalUnits,
        o.totalValue,
        o.advanceReceived,
        o.balanceAmount,
        o.paymentStatus,
        o.productionStatus,
        o.dispatchStatus,
        o.orderStatus,
        o.notes || '',
      ];
    });

    // Add summary row at bottom
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
    const totalAdvance = orders.reduce((sum, o) => sum + (o.advanceReceived || 0), 0);
    const totalBalance = orders.reduce((sum, o) => sum + (o.balanceAmount || 0), 0);
    const summaryRow = [
      'TOTALS / SUMMARY',
      '',
      '',
      `${orders.length} Orders`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalRevenue,
      totalAdvance,
      totalBalance,
      '',
      '',
      '',
      '',
      '',
    ];

    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
      summaryRow.map(escapeCsv).join(','),
    ];

    triggerCsvDownload(`vartu_creations_sales_ledger_${dateStamp}.csv`, csvLines.join('\r\n'));
  };

  // 2. Export Financial Performance & Channel Breakdown
  const handleExportPerformanceSummaryCsv = () => {
    setIsExportMenuOpen(false);
    const dateStamp = new Date().toISOString().split('T')[0];

    const lines: string[] = [];

    // Section 1: Executive KPIs
    lines.push(escapeCsv('VARTU CREATIONS — FINANCIAL PERFORMANCE SUMMARY'));
    lines.push([escapeCsv('Report Generated Date'), escapeCsv(dateStamp)].join(','));
    lines.push('');
    lines.push([escapeCsv('Metric'), escapeCsv('Value'), escapeCsv('Notes')].join(','));
    lines.push([escapeCsv('Total Gross Sales (INR)'), escapeCsv(totalSales), escapeCsv(`Across ${totalOrdersCount} orders`)].join(','));
    lines.push([escapeCsv('Average Order Value (INR)'), escapeCsv(aov), escapeCsv('Average per confirmed order')].join(','));
    lines.push([escapeCsv('Repeat Customer Rate (%)'), escapeCsv(`${repeatRate}%`), escapeCsv(`${repeatCount} repeat customers`)].join(','));
    lines.push([escapeCsv('Quotation Win Rate (%)'), escapeCsv(`${quotationConversionRate}%`), escapeCsv(`${acceptedQuotations} / ${quotations.length} accepted`)].join(','));
    lines.push([escapeCsv('Lead-to-Order Conversion (%)'), escapeCsv(`${leadConversionRate}%`), escapeCsv(`${confirmedLeads} confirmed leads`)].join(','));
    lines.push('');

    // Section 2: Marketing Channels
    lines.push(escapeCsv('MARKETING CHANNEL ROI & ATTRIBUTION'));
    lines.push(
      [
        escapeCsv('Channel Source'),
        escapeCsv('Total Inquiries'),
        escapeCsv('Confirmed Orders'),
        escapeCsv('Conversion Rate (%)'),
        escapeCsv('Attributed Revenue (INR)'),
      ].join(',')
    );

    Object.entries(sourceStats).forEach(([src, st]) => {
      const conv = st.leads > 0 ? Math.round((st.orders / st.leads) * 100) : 0;
      lines.push(
        [
          escapeCsv(src),
          escapeCsv(st.leads),
          escapeCsv(st.orders),
          escapeCsv(`${conv}%`),
          escapeCsv(st.revenue),
        ].join(',')
      );
    });

    lines.push('');

    // Section 3: Category Breakdown
    lines.push(escapeCsv('CRAFT CATEGORY REVENUE SHARE'));
    lines.push(
      [
        escapeCsv('Craft Category'),
        escapeCsv('Revenue (INR)'),
        escapeCsv('Share Percentage (%)'),
      ].join(',')
    );

    Object.entries(categoryStats).forEach(([cat, rev]) => {
      const pct = totalSales > 0 ? Math.round((rev / totalSales) * 100) : 0;
      lines.push([escapeCsv(cat), escapeCsv(rev), escapeCsv(`${pct}%`)].join(','));
    });

    triggerCsvDownload(`vartu_financial_analytics_${dateStamp}.csv`, lines.join('\r\n'));
  };

  // 3. Export Product Profitability & Margins
  const handleExportProductMarginsCsv = () => {
    setIsExportMenuOpen(false);
    const dateStamp = new Date().toISOString().split('T')[0];

    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Selling Price (INR)',
      'Calculated Cost (INR)',
      'Gross Profit Per Unit (INR)',
      'Gross Margin (%)',
      'Raw Material Cost',
      'Labour Cost',
      'Packaging Cost',
      'Current Stock',
      'MOQ',
      'Bulk Price (INR)',
    ];

    const rows = sortedProductsByMargin.map((p) => {
      const profit = Math.max(0, p.sellingPrice - p.cost);
      return [
        p.sku,
        p.name,
        p.category,
        p.sellingPrice,
        p.cost,
        profit,
        `${p.margin}%`,
        p.costing.rawMaterial,
        p.costing.labour,
        p.costing.packaging,
        p.stockQuantity,
        p.moq,
        p.bulkPrice,
      ];
    });

    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ];

    triggerCsvDownload(`vartu_product_margins_${dateStamp}.csv`, csvLines.join('\r\n'));
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Action */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-900">Executive Sales & Business Analytics</h2>
          <p className="text-xs text-stone-500">
            Analyze sales channels, profit margins, conversion funnels & customer lifetime value to steer Vartu's growth.
          </p>
        </div>

        {/* Export CSV Button & Dropdown */}
        <div className="relative shrink-0 flex items-center gap-2">
          {exportNotice && (
            <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1 animate-in fade-in duration-200">
              <Check className="w-3.5 h-3.5" />
              <span>{exportNotice}</span>
            </div>
          )}

          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {isExportMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-stone-200 z-30 py-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setIsExportMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-stone-100 bg-stone-50/50">
                  <span className="font-bold text-stone-900 uppercase text-[10px] tracking-wider block">
                    Choose Export Dataset
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Exports clean UTF-8 CSV compatible with Excel & Google Sheets.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExportSalesOrdersCsv}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-stone-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-stone-900">Sales & Orders Ledger</div>
                    <div className="text-[10px] text-stone-500">
                      All {orders.length} orders with customer details, items, amounts, & payment status
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportPerformanceSummaryCsv}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-stone-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-stone-900">Financial & Channel Analytics</div>
                    <div className="text-[10px] text-stone-500">
                      Channel ROI attribution, category revenue share, and executive KPIs
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportProductMarginsCsv}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-stone-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-stone-900">Product Profitability & Margins</div>
                    <div className="text-[10px] text-stone-500">
                      Costing breakdowns, gross margins, stock quantities, and bulk pricing
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-500 font-medium">Average Order Value (AOV)</span>
          <div className="font-mono font-bold text-lg text-stone-900 mt-1">{formatCurrency(aov)}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Across {totalOrdersCount} completed orders</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-500 font-medium">Repeat Purchase Rate</span>
          <div className="font-mono font-bold text-lg text-emerald-700 mt-1">{repeatRate}%</div>
          <div className="text-[10px] text-stone-400 mt-0.5">{repeatCount} repeat customers</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-500 font-medium">Quotation Win Rate</span>
          <div className="font-mono font-bold text-lg text-amber-900 mt-1">{quotationConversionRate}%</div>
          <div className="text-[10px] text-stone-400 mt-0.5">{acceptedQuotations} / {quotations.length} accepted</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-500 font-medium">Lead-to-Order Conversion</span>
          <div className="font-mono font-bold text-lg text-stone-900 mt-1">{leadConversionRate}%</div>
          <div className="text-[10px] text-stone-400 mt-0.5">{confirmedLeads} confirmed deals</div>
        </div>
      </div>

      {/* Channel Source Performance Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
              Marketing Channel ROI & Attribution
            </h3>
            <p className="text-[11px] text-stone-500">
              Evaluates which inbound channel generates the highest conversion and revenue.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportPerformanceSummaryCsv}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
            title="Download channel breakdown CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Table</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Acquisition Channel</th>
                <th className="py-2.5 px-3 text-center">Total Inquiries</th>
                <th className="py-2.5 px-3 text-center">Confirmed Deals</th>
                <th className="py-2.5 px-3 text-center">Conversion %</th>
                <th className="py-2.5 px-3 text-right">Attributed Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {Object.entries(sourceStats).map(([source, stats]) => {
                const conv = stats.leads > 0 ? Math.round((stats.orders / stats.leads) * 100) : 0;

                return (
                  <tr key={source} className="hover:bg-stone-50/80">
                    <td className="py-2.5 px-3 font-semibold text-stone-900">{source}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{stats.leads}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-stone-900">
                      {stats.orders}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-900 font-bold">{conv}%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                      {formatCurrency(stats.revenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Columns: Category Share & High Margin Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Revenue Distribution */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-3">
          <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
            Revenue Share by Craft Category
          </h3>
          <div className="space-y-2.5 mt-2">
            {Object.entries(categoryStats).map(([cat, rev]) => {
              const pct = totalSales > 0 ? Math.round((rev / totalSales) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-stone-800">{cat}</span>
                    <span className="font-mono font-bold text-stone-900">
                      {formatCurrency(rev)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-700 rounded-full"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highest Margin Products Ranking */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
              Top Profitable Products (Gross Margin %)
            </h3>
            <button
              type="button"
              onClick={handleExportProductMarginsCsv}
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
              title="Download margins CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Margins</span>
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {sortedProductsByMargin.slice(0, 5).map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-stone-900 line-clamp-1">{p.name}</div>
                  <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                    Price: {formatCurrency(p.sellingPrice)} · Cost: {formatCurrency(p.cost)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-700 text-sm">{p.margin}%</div>
                  <div className="text-[10px] text-stone-400">Gross Margin</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
