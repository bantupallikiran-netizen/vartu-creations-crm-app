import React from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { formatCurrency } from '../utils/calculations.ts';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowRight,
  Package,
  Sparkles,
  Users,
  CheckCircle2,
  DollarSign,
  Plus,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    leads,
    orders,
    customers,
    inventory,
    followUps,
    setActiveTab,
    setQuickAction,
  } = useCrm();

  // Metrics calculation
  const totalSalesValue = orders.reduce((acc, o) => acc + (o.totalValue || 0), 0);
  const totalReceivedValue = orders.reduce((acc, o) => acc + (o.advanceReceived || 0), 0);
  const totalOutstanding = orders.reduce((acc, o) => acc + (o.balanceAmount || 0), 0);

  const activeOrders = orders.filter((o) => !['Completed', 'Delivered', 'Cancelled'].includes(o.orderStatus));
  const productionOrders = orders.filter((o) =>
    ['Production Pending', 'Production In Progress', 'Quality Check', 'Packed'].includes(o.productionStatus)
  );
  const readyToDispatchOrders = orders.filter((o) => o.dispatchStatus === 'Ready to Dispatch');

  const newLeads = leads.filter((l) => l.status === 'New');
  const hotLeads = leads.filter((l) => ['High', 'Urgent'].includes(l.priority));

  const overdueFollowUps = followUps.filter((f) => f.status === 'Pending' && new Date(f.scheduledDate) < new Date());
  const todayFollowUps = followUps.filter((f) => {
    if (f.status !== 'Pending') return false;
    const today = new Date().toISOString().split('T')[0];
    return f.scheduledDate === today;
  });

  const lowStockItems = inventory.filter((item) => item.currentStock <= item.minStockLevel);
  const outOfStockItems = inventory.filter((item) => item.currentStock <= 0);

  const customizedOrders = orders.filter((o) => o.orderType === 'Customized' || o.items.some((i) => i.customizationDetails));
  const repeatCustomersCount = customers.filter((c) => c.totalOrders > 1).length;

  // Source breakdown
  const sourceCount: Record<string, number> = {};
  leads.forEach((l) => {
    sourceCount[l.leadSource] = (sourceCount[l.leadSource] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-stone-900">Vartu Creations Studio Hub</h2>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-900 rounded-md">
              Live Operations
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Track lead inquiries, customize resin artworks, control curing timelines, generate GST quotations, and monitor dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setQuickAction('newOrder')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Quick Order</span>
          </button>
          <button
            onClick={() => setQuickAction('newLead')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Lead</span>
          </button>
          <button
            onClick={() => setQuickAction('newQuotation')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <span>+ Quotation</span>
          </button>
          <button
            onClick={() => setActiveTab('ai-assistant')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Co-pilot</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Order Value */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Orders Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-stone-900 mt-2">
            {formatCurrency(totalSalesValue)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
            <span>Collected: <strong className="text-emerald-700 font-mono">{formatCurrency(totalReceivedValue)}</strong></span>
          </div>
        </div>

        {/* Outstanding Pending */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Outstanding Balance</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-900 mt-2">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            <span>Across active orders & advances</span>
          </div>
        </div>

        {/* Active Production */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">In Production / QC</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-stone-900 mt-2">
            {productionOrders.length} <span className="text-xs font-normal text-stone-500">orders</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            <span>{readyToDispatchOrders.length} ready for dispatch</span>
          </div>
        </div>

        {/* Hot Leads & Follow-ups */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Action Required Today</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-stone-900 mt-2">
            {overdueFollowUps.length + todayFollowUps.length} <span className="text-xs font-normal text-stone-500">follow-ups</span>
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">
            <span>{overdueFollowUps.length} overdue · {todayFollowUps.length} due today</span>
          </div>
        </div>
      </div>

      {/* Operations Quick Overview Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Active Leads Pipeline */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-stone-600" />
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Inbound Leads Pipeline</h3>
              </div>
              <button
                onClick={() => setActiveTab('leads')}
                className="text-xs text-amber-800 hover:text-amber-900 font-medium flex items-center gap-0.5"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-stone-100 mt-2">
              {leads.slice(0, 4).map((lead) => (
                <div key={lead.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-stone-900">{lead.customerName}</div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                      <span>{lead.leadSource}</span>
                      <span>·</span>
                      <span className="font-mono text-stone-600">{lead.quantity} pcs</span>
                      <span>·</span>
                      <span className="text-amber-800">{lead.priority} Priority</span>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium whitespace-nowrap">
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('leads')}
            className="w-full mt-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-lg text-center"
          >
            Manage {leads.length} Leads & Inquiries
          </button>
        </div>

        {/* Column 2: Orders in Production / Customization */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-stone-600" />
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Active Orders & Customization</h3>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs text-amber-800 hover:text-amber-900 font-medium flex items-center gap-0.5"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-stone-100 mt-2">
              {activeOrders.slice(0, 4).map((ord) => (
                <div key={ord.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                      <span>{ord.orderNumber}</span>
                      <span className="text-stone-400 font-normal">({ord.customerName})</span>
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{formatCurrency(ord.totalValue)}</span>
                      <span>·</span>
                      <span className="text-stone-600">Due: {ord.requiredDeliveryDate}</span>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-medium whitespace-nowrap">
                    {ord.orderStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('production')}
            className="w-full mt-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-lg text-center"
          >
            Open Production Tracker & QC
          </button>
        </div>

        {/* Column 3: Low Stock & Studio Inventory Warnings */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Studio Inventory Alerts</h3>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-xs text-amber-800 hover:text-amber-900 font-medium flex items-center gap-0.5"
              >
                Stock <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                All raw materials and items are at healthy levels.
              </div>
            ) : (
              <div className="divide-y divide-stone-100 mt-2">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-stone-900">{item.name}</div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{item.sku}</span>
                        <span>·</span>
                        <span>Min: {item.minStockLevel} {item.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-rose-600">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="text-[10px] text-stone-400">Reorder Level</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('inventory')}
            className="w-full mt-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-lg text-center"
          >
            Review All {inventory.length} Inventory Items
          </button>
        </div>
      </div>

      {/* Analytics Insights Banner */}
      <div className="p-4 rounded-xl bg-amber-900 text-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-300" />
            <h3 className="text-sm font-semibold text-white">Vartu Sales Engine & Repeat Client Performance</h3>
          </div>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            {repeatCustomersCount} loyal repeat customers identified (
            {customers.length > 0 ? Math.round((repeatCustomersCount / customers.length) * 100) : 0}% repeat rate).
            Instagram and Direct WhatsApp generate the highest conversion rates for customized gifts and wedding favors.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('reports')}
            className="px-3 py-1.5 text-xs font-medium text-stone-900 bg-white hover:bg-stone-100 rounded-lg transition-colors"
          >
            View Sales Reports
          </button>
          <button
            onClick={() => setActiveTab('ai-assistant')}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-300 hover:bg-amber-200 rounded-lg transition-colors"
          >
            Ask AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
};
