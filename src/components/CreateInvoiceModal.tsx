import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { InvoiceItem, Order } from '../types.ts';
import { formatCurrency } from '../utils/calculations.ts';
import {
  X,
  FileText,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';

interface CreateInvoiceModalProps {
  onClose: () => void;
  initialOrderId?: string;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  onClose,
  initialOrderId,
}) => {
  const { orders, customers, products, settings, addInvoice, generateInvoiceForOrder } = useCrm();

  const [mode, setMode] = useState<'fromOrder' | 'custom'>(initialOrderId ? 'fromOrder' : 'fromOrder');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || (orders[0]?.id || ''));

  // Custom Invoice Form States
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    return new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  });
  const [gstType, setGstType] = useState<'CGST_SGST' | 'IGST' | 'NONE'>('CGST_SGST');
  const [gstRatePercent, setGstRatePercent] = useState(18);
  const [notes, setNotes] = useState('Handcrafted customized products by Vartu Creations.');

  // Custom line items
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    {
      productName: products[0]?.name || 'Handcrafted Resin Product',
      sku: products[0]?.sku || 'VC-RSN-01',
      quantity: 1,
      unitPrice: products[0]?.sellingPrice || 1200,
      customizationDetails: '',
      total: products[0]?.sellingPrice || 1200,
    },
  ]);
  const [amountPaidInitial, setAmountPaidInitial] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle selecting customer in custom mode
  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setCustomerName(found.name);
      setCustomerMobile(found.mobile);
      setCustomerEmail(found.email || '');
      setCustomerGstin(found.gstin || '');
      const addr =
        typeof found.address === 'object' && found.address
          ? `${found.address.street || ''}, ${found.address.city || ''}, ${found.address.state || ''}`.replace(/^,\s*|,\s*$/g, '')
          : String(found.address || '');
      setBillingAddress(addr);
    }
  };

  // Add line item
  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        productName: 'Handcrafted Craft Item',
        quantity: 1,
        unitPrice: 500,
        total: 500,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, updates: Partial<InvoiceItem>) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, ...updates };
        const qty = Math.max(1, Number(updated.quantity) || 1);
        const rate = Math.max(0, Number(updated.unitPrice) || 0);
        updated.quantity = qty;
        updated.unitPrice = rate;
        updated.total = qty * rate;
        return updated;
      })
    );
  };

  // Calculations for custom mode
  const customSubtotal = lineItems.reduce((sum, it) => sum + (it.total || 0), 0);
  const customCgst = gstType === 'CGST_SGST' ? Math.round((customSubtotal * (gstRatePercent / 2)) / 100) : 0;
  const customSgst = gstType === 'CGST_SGST' ? Math.round((customSubtotal * (gstRatePercent / 2)) / 100) : 0;
  const customIgst = gstType === 'IGST' ? Math.round((customSubtotal * gstRatePercent) / 100) : 0;
  const customGrandTotal = customSubtotal + customCgst + customSgst + customIgst;
  const customBalanceDue = Math.max(0, customGrandTotal - amountPaidInitial);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'fromOrder') {
        if (!selectedOrderId) {
          throw new Error('Please select an order to generate the invoice.');
        }
        generateInvoiceForOrder(selectedOrderId);
        onClose();
      } else {
        // Custom Invoice
        const trimmedName = customerName.trim();
        if (!trimmedName) throw new Error('Please enter customer name.');
        if (lineItems.length === 0) throw new Error('Please add at least one line item.');

        const status =
          customBalanceDue <= 0
            ? 'Paid'
            : amountPaidInitial > 0
            ? 'Partially Paid'
            : 'Issued';

        addInvoice({
          orderId: `ord-adhoc-${Date.now()}`,
          orderNumber: 'DIRECT-INVOICE',
          customerId: customerId || `cust-${Date.now()}`,
          customerName: trimmedName,
          customerMobile: customerMobile.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerGstin: customerGstin.trim() || undefined,
          billingAddress: billingAddress.trim() || 'Studio Handover, Hyderabad',
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate,
          items: lineItems,
          gstRatePercent: gstType === 'NONE' ? 0 : gstRatePercent,
          gstType,
          subtotal: customSubtotal,
          cgst: customCgst,
          sgst: customSgst,
          igst: customIgst,
          grandTotal: customGrandTotal,
          amountPaid: amountPaidInitial,
          balanceDue: customBalanceDue,
          status,
          notes: notes.trim(),
          termsAndConditions:
            '1. Goods once crafted and approved cannot be returned.\n2. Please settle balance before delivery.\n3. UPI: vartucreations@okhdfcbank',
        });

        onClose();
      }
    } catch (err: any) {
      console.error('Failed to create invoice:', err);
      setError(err?.message || 'Failed to generate invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-700" />
            <h3 className="font-serif text-lg font-bold text-stone-900">Generate Tax Invoice</h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex rounded-lg bg-stone-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('fromOrder')}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              mode === 'fromOrder' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Generate from Active Order
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              mode === 'custom' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Create Custom Ad-hoc Invoice
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'fromOrder' ? (
            /* Mode 1: From Order */
            <div className="space-y-4">
              <div>
                <label className="block text-stone-700 mb-1 font-medium">Select Order *</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-medium text-xs text-stone-900"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.customerName} ({formatCurrency(o.totalValue)}) · {o.orderStatus}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder && (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-stone-900 text-sm">{selectedOrder.customerName}</div>
                      <div className="text-stone-500 font-mono text-[11px]">{selectedOrder.customerMobile}</div>
                      <div className="text-stone-600 text-[11px] mt-0.5">{selectedOrder.customerAddress}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {formatCurrency(selectedOrder.totalValue)}
                      </span>
                      <div className="text-[10px] text-stone-500">Order Total</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-500 block">Advance Settled:</span>
                      <strong className="text-emerald-800 font-mono">{formatCurrency(selectedOrder.advanceReceived)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Remaining Due:</span>
                      <strong className="text-rose-800 font-mono">{formatCurrency(selectedOrder.balanceAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Target Delivery:</span>
                      <strong className="text-stone-800 font-mono">{selectedOrder.requiredDeliveryDate}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 text-stone-600 text-[11px]">
                    <strong>Line Items:</strong>{' '}
                    {selectedOrder.items.map((it) => `${it.productName} (x${it.quantity})`).join(', ')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Custom Invoice Form */
            <div className="space-y-4">
              {/* Customer Selector */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 uppercase text-[10px] tracking-wider">
                    Client Details
                  </span>
                  <select
                    value={customerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="p-1 bg-white border border-stone-200 rounded text-[11px]"
                  >
                    <option value="">+ New / Custom Client</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.mobile})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Radhika Sharma"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Mobile / WhatsApp</label>
                    <input
                      type="text"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      placeholder="+91 98..."
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Billing Address</label>
                    <input
                      type="text"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="e.g. Banjara Hills, Hyderabad"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Client GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={customerGstin}
                      onChange={(e) => setCustomerGstin(e.target.value)}
                      placeholder="e.g. 36ABCDE1234F1Z9"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 uppercase text-[10px] tracking-wider">
                    Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-stone-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={item.productName}
                          onChange={(e) => handleUpdateLineItem(idx, { productName: e.target.value })}
                          placeholder="Item name / craft description"
                          className="flex-1 p-1.5 border border-stone-200 rounded text-xs font-medium"
                        />
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-stone-500 text-[10px]">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateLineItem(idx, { quantity: Number(e.target.value) })}
                            className="w-full p-1.5 border border-stone-200 rounded font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-500 text-[10px]">Unit Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateLineItem(idx, { unitPrice: Number(e.target.value) })}
                            className="w-full p-1.5 border border-stone-200 rounded font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-500 text-[10px]">Total (₹)</label>
                          <div className="p-1.5 bg-stone-50 border border-stone-200 rounded font-mono text-right font-bold text-stone-900">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST & Settlement Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">GST Taxation</label>
                  <select
                    value={gstType}
                    onChange={(e) => setGstType(e.target.value as any)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="CGST_SGST">Intra-State (CGST 9% + SGST 9%)</option>
                    <option value="IGST">Inter-State (IGST 18%)</option>
                    <option value="NONE">No GST (Bill of Supply)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(customSubtotal)}</span>
                </div>
                {gstType !== 'NONE' && (
                  <div className="flex justify-between text-stone-600">
                    <span>GST (18%):</span>
                    <span className="font-mono">{formatCurrency(customCgst + customSgst + customIgst)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-sm">{formatCurrency(customGrandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{mode === 'fromOrder' ? 'Generate from Order' : 'Create Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
