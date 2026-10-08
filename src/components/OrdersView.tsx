import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { Invoice, Order, OrderStatus, OrderType } from '../types.ts';
import { formatCurrency } from '../utils/calculations.ts';
import { InvoicePdfModal } from './InvoicePdfModal.tsx';
import {
  ShoppingBag,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  User,
  Eye,
  X,
  FileCheck,
  FileText,
} from 'lucide-react';

export const OrdersView: React.FC = () => {
  const { orders, updateOrderStatus, updateOrder, setQuickAction, setActiveTab, invoices, generateInvoiceForOrder } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceToView, setInvoiceToView] = useState<Invoice | null>(null);

  const orderTypes: OrderType[] = ['Retail', 'Customized', 'Bulk', 'Corporate', 'Wholesale'];

  const allStatuses: OrderStatus[] = [
    'Order Confirmed',
    'Advance Pending',
    'Payment Received',
    'Customization Pending',
    'Design Approval',
    'Production Pending',
    'Production In Progress',
    'Quality Check',
    'Packed',
    'Ready to Dispatch',
    'Dispatched',
    'Delivered',
    'Completed',
    'Cancelled',
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerMobile.includes(searchTerm);
    const matchesType = typeFilter === 'all' || o.orderType === typeFilter;
    const matchesStatus = statusFilter === 'all' || o.orderStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Order Management & Customizations</h2>
          <p className="text-xs text-stone-500">
            {orders.length} active and completed orders with design version approvals, balance tracking & dispatch workflow.
          </p>
        </div>

        <button
          onClick={() => setQuickAction('newOrder')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Order</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order #, customer, mobile..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 focus:bg-white text-stone-800"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none"
          >
            <option value="all">All Order Types</option>
            {orderTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none"
          >
            <option value="all">All Order Statuses</option>
            {allStatuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Order # & Date</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Type & Priority</th>
                <th className="py-3 px-4">Items & Customization</th>
                <th className="py-3 px-4">Order Value & Balance</th>
                <th className="py-3 px-4">Required Delivery</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((ord) => {
                const hasCustom = ord.items.some((i) => i.customizationDetails);

                return (
                  <tr key={ord.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-stone-900">{ord.orderNumber}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{ord.orderDate}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{ord.customerName}</div>
                      <div className="text-[11px] font-mono text-stone-500 mt-0.5">{ord.customerMobile}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        {ord.orderType}
                      </span>
                      <div className="text-[10px] text-amber-800 font-medium mt-1">{ord.priority} Priority</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="truncate font-medium text-stone-800">
                        {ord.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </div>
                      {hasCustom && (
                        <div className="text-[11px] text-amber-800 font-medium mt-0.5 flex items-center gap-1">
                          <span>✨ Custom Specs Attached</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-stone-900 text-sm">
                        {formatCurrency(ord.totalValue)}
                      </div>
                      <div
                        className={`text-[11px] font-mono mt-0.5 ${
                          ord.balanceAmount > 0 ? 'text-rose-600 font-medium' : 'text-emerald-700'
                        }`}
                      >
                        {ord.balanceAmount > 0 ? `Bal: ${formatCurrency(ord.balanceAmount)}` : '✓ Paid in Full'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-stone-700">{ord.requiredDeliveryDate}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">{ord.dispatchStatus}</div>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={ord.orderStatus}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className="text-[11px] font-medium px-2 py-1 bg-stone-100 border border-stone-200 rounded-md text-stone-700 focus:outline-none"
                      >
                        {allStatuses.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                      >
                        View 360°
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order 360° Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full p-6 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-stone-900">{selectedOrder.orderNumber}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-medium">
                    {selectedOrder.orderType}
                  </span>
                </div>
                <div className="text-xs text-stone-500 font-mono mt-0.5">
                  Customer: {selectedOrder.customerName} ({selectedOrder.customerMobile})
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lifecycle Status Bar */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-400">Order Status:</span>
                <div className="font-bold text-stone-900 mt-0.5">{selectedOrder.orderStatus}</div>
              </div>
              <div>
                <span className="text-stone-400">Production Status:</span>
                <div className="font-bold text-stone-900 mt-0.5">{selectedOrder.productionStatus}</div>
              </div>
              <div>
                <span className="text-stone-400">Dispatch Status:</span>
                <div className="font-bold text-stone-900 mt-0.5">{selectedOrder.dispatchStatus}</div>
              </div>
              <div>
                <span className="text-stone-400">Payment Status:</span>
                <div className="font-bold text-emerald-800 mt-0.5">{selectedOrder.paymentStatus}</div>
              </div>
            </div>

            {/* Customization Details & Version History */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                Items & Customization Specs
              </h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white border border-stone-200 rounded-xl space-y-2">
                    <div className="flex justify-between font-semibold text-stone-900">
                      <span>{item.productName} ({item.quantity} pcs)</span>
                      <span className="font-mono">{formatCurrency(item.total)}</span>
                    </div>

                    {item.customizationDetails && (
                      <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-1.5 text-[11px]">
                        <div className="flex justify-between font-semibold text-amber-950">
                          <span>Customization Version {item.customizationDetails.version}</span>
                          <span className="text-emerald-700">✓ Customer Approved</span>
                        </div>
                        {item.customizationDetails.nameText && (
                          <div>
                            <strong>Name / Engraving:</strong> {item.customizationDetails.nameText}
                          </div>
                        )}
                        {item.customizationDetails.color && (
                          <div>
                            <strong>Color / Inlay:</strong> {item.customizationDetails.color}
                          </div>
                        )}
                        {item.customizationDetails.specialInstructions && (
                          <div>
                            <strong>Instructions:</strong> {item.customizationDetails.specialInstructions}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Courier info */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <div>
                <span className="font-semibold text-stone-900">Payment Summary</span>
                <div className="mt-1 space-y-0.5 text-stone-600">
                  <div>Total Value: <strong className="font-mono">{formatCurrency(selectedOrder.totalValue)}</strong></div>
                  <div>Advance Received: <span className="font-mono text-emerald-700">{formatCurrency(selectedOrder.advanceReceived)}</span></div>
                  <div>Outstanding Balance: <span className="font-mono text-rose-600 font-bold">{formatCurrency(selectedOrder.balanceAmount)}</span></div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-stone-900">Delivery & Tracking</span>
                <div className="mt-1 space-y-0.5 text-stone-600">
                  <div>Delivery Due: <span className="font-mono">{selectedOrder.requiredDeliveryDate}</span></div>
                  <div>Courier: {selectedOrder.courier || 'Pending packaging'}</div>
                  {selectedOrder.trackingNumber && (
                    <div>AWB Tracking: <span className="font-mono font-semibold">{selectedOrder.trackingNumber}</span></div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  const inv =
                    invoices.find((i) => i.orderId === selectedOrder.id) ||
                    generateInvoiceForOrder(selectedOrder.id);
                  setInvoiceToView(inv);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Tax Invoice (View & Share)</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {invoiceToView && (
        <InvoicePdfModal invoice={invoiceToView} onClose={() => setInvoiceToView(null)} />
      )}
    </div>
  );
};
