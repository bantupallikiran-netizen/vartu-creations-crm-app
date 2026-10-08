import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { Quotation, QuotationItem, QuotationStatus } from '../types.ts';
import { calculateQuotationTotals, formatCurrency } from '../utils/calculations.ts';
import { QuotationPdfModal } from './QuotationPdfModal.tsx';
import { StageAttachmentsModal } from './StageAttachmentsModal.tsx';
import {
  FileText,
  Plus,
  Search,
  Eye,
  CheckCircle,
  Clock,
  Printer,
  Trash2,
  X,
  AlertCircle,
  Paperclip,
  Share2,
} from 'lucide-react';

export const QuotationsView: React.FC = () => {
  const {
    quotations,
    addQuotation,
    updateQuotation,
    convertQuotationToOrder,
    products,
    customers,
    settings,
    documents,
  } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeQuotationForPdf, setActiveQuotationForPdf] = useState<Quotation | null>(null);
  const [selectedQuotationForAttachments, setSelectedQuotationForAttachments] = useState<Quotation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for New Quotation
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [deliveryTimeline, setDeliveryTimeline] = useState('7-10 working days from advance receipt');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [packagingCharge, setPackagingCharge] = useState(100);
  const [shippingCharge, setShippingCharge] = useState(150);
  const [gstRatePercent, setGstRatePercent] = useState(settings.defaultGstRate || 18);
  const [gstType, setGstType] = useState<'CGST_SGST' | 'IGST' | 'NONE'>('CGST_SGST');

  const [items, setItems] = useState<QuotationItem[]>([
    {
      productId: products[0]?.id || 'prod-1',
      productName: products[0]?.name || 'Artisan Resin Floral Bookmark',
      sku: products[0]?.sku || 'RES-BMK-001',
      quantity: 5,
      unitPrice: products[0]?.sellingPrice || 199,
      customizationNotes: 'Gold flakes with custom initials',
      customizationCharge: 0,
      itemTotal: (products[0]?.sellingPrice || 199) * 5,
    },
  ]);

  // Handle selecting an existing customer
  const handleSelectCustomer = (cId: string) => {
    setSelectedCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setCustomerName(found.name);
      setCustomerMobile(found.mobile);
      setCustomerAddress(`${found.address.street}, ${found.address.city}, ${found.address.state}`);
      setCustomerEmail(found.email || '');
    }
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    setItems([
      ...items,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        sku: defaultProd.sku,
        quantity: 1,
        unitPrice: defaultProd.sellingPrice,
        customizationNotes: '',
        customizationCharge: 0,
        itemTotal: defaultProd.sellingPrice,
      },
    ]);
  };

  const handleItemProductChange = (index: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    if (!prod) return;
    const newItems = [...items];
    const qty = newItems[index].quantity;
    newItems[index] = {
      ...newItems[index],
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unitPrice: prod.sellingPrice,
      itemTotal: prod.sellingPrice * qty + (newItems[index].customizationCharge || 0),
    };
    setItems(newItems);
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    const newItems = [...items];
    const q = Math.max(1, qty);
    newItems[index] = {
      ...newItems[index],
      quantity: q,
      itemTotal: newItems[index].unitPrice * q + (newItems[index].customizationCharge || 0),
    };
    setItems(newItems);
  };

  const handleItemCustomChargeChange = (index: number, charge: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      customizationCharge: charge,
      itemTotal: newItems[index].unitPrice * newItems[index].quantity + charge,
    };
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Live calculation
  const totals = calculateQuotationTotals({
    items,
    discountAmount,
    packagingCharge,
    shippingCharge,
    gstRatePercent: gstType === 'NONE' ? 0 : gstRatePercent,
    advancePercentage: settings.defaultAdvancePercent || 50,
  });

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerMobile) {
      alert('Please enter customer name and contact');
      return;
    }

    const newQt = addQuotation({
      quotationDate: new Date().toISOString().split('T')[0],
      validUntil,
      customerId: selectedCustomerId || `temp-${Date.now()}`,
      customerName,
      customerMobile,
      customerAddress: customerAddress || 'Hyderabad, Telangana',
      customerEmail,
      items,
      discountAmount,
      packagingCharge,
      shippingCharge,
      gstRatePercent: gstType === 'NONE' ? 0 : gstRatePercent,
      gstType,
      subtotal: totals.subtotalBeforeDiscount,
      gstAmount: totals.gstAmount,
      grandTotal: totals.grandTotal,
      advanceRequired: totals.advanceRequired,
      balanceAmount: totals.balanceAmount,
      deliveryTimeline,
      termsAndConditions:
        '1. 50% advance required to secure raw materials and studio scheduling.\n2. Resin products require 48 hours curing time.\n3. Custom color tones may have subtle handmade variations.\n4. Damaged in transit covered via insurance replacement.',
      status: 'Sent',
    });

    setShowCreateModal(false);
    setActiveQuotationForPdf(newQt);
  };

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Quotations & Pricing Estimates</h2>
          <p className="text-xs text-stone-500">
            {quotations.length} formal quotes generated with Indian GST architecture and branded PDF export.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Quotation</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search quotations by quote # or customer name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 focus:bg-white text-stone-800"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none"
        >
          <option value="all">All Quotation Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Quotations List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Quote Number</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Items Quoted</th>
                <th className="py-3 px-4">Grand Total & Advance</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredQuotations.map((q) => (
                <tr key={q.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-stone-900">{q.quotationNumber}</div>
                    <div className="text-[11px] text-stone-400 mt-0.5">{q.quotationDate}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-stone-900">{q.customerName}</div>
                    <div className="text-[11px] font-mono text-stone-500 mt-0.5">{q.customerMobile}</div>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <div className="truncate text-stone-800 font-medium">
                      {q.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {q.items.length} line {q.items.length === 1 ? 'item' : 'items'}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-stone-900 text-sm">
                      {formatCurrency(q.grandTotal)}
                    </div>
                    <div className="text-[11px] text-amber-800 font-mono mt-0.5">
                      Adv: {formatCurrency(q.advanceRequired)}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-stone-600 font-mono text-[11px]">
                    Valid till: {q.validUntil}
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={q.status}
                      onChange={(e) => updateQuotation(q.id, { status: e.target.value as QuotationStatus })}
                      className="text-[11px] font-medium px-2 py-1 bg-stone-100 border border-stone-200 rounded-md text-stone-700 focus:outline-none"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Attachments / Media CTA */}
                      {(() => {
                        const docCount = documents.filter(
                          (d) => d.linkedEntityId === q.id || (d.stage === 'Quotation' && d.linkedEntityNumber === q.quotationNumber)
                        ).length;
                        return (
                          <button
                            onClick={() => setSelectedQuotationForAttachments(q)}
                            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                              docCount > 0
                                ? 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200 border border-indigo-300'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                            title="View/Upload/Share 3D Renders, Spec Sheets, Videos (Stored in Documents)"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Media{docCount > 0 ? ` (${docCount})` : ''}</span>
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => setActiveQuotationForPdf(q)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                        title="View / Print Branded PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      {q.status !== 'Accepted' && (
                        <button
                          onClick={() => {
                            const order = convertQuotationToOrder(q.id);
                            if (order) alert(`Converted to Order ${order.orderNumber}!`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-md transition-colors"
                          title="Convert Quotation into Active Order"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Order</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredQuotations.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-500">
                    No quotations match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Quotation Creator Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-stone-900">Create Branded Quotation</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuotation} className="space-y-4 text-xs">
              {/* Customer Selection */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">Customer Details</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="p-1 bg-white border border-stone-200 rounded text-[11px]"
                  >
                    <option value="">Select Existing Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.mobile})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Pooja Reddy"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1">Mobile / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      placeholder="e.g. +91 98491 12345"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1">Address / City</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="e.g. Banjara Hills, Hyderabad"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. pooja@example.com"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">
                    Product Line Items ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Product
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="p-2.5 bg-white border border-stone-200 rounded-lg space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <label className="block text-stone-500 text-[10px] mb-0.5">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemProductChange(index, e.target.value)}
                            className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded text-xs"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (₹{p.sellingPrice})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-stone-500 text-[10px] mb-0.5">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemQtyChange(index, Number(e.target.value))}
                            className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded font-mono text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-stone-500 text-[10px] mb-0.5">Rate (₹)</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].unitPrice = Number(e.target.value);
                              newItems[index].itemTotal =
                                Number(e.target.value) * newItems[index].quantity +
                                (newItems[index].customizationCharge || 0);
                              setItems(newItems);
                            }}
                            className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded font-mono text-right"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-between pl-2">
                          <div>
                            <div className="text-[10px] text-stone-400">Total</div>
                            <div className="font-mono font-bold text-stone-900">{formatCurrency(item.itemTotal)}</div>
                          </div>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-stone-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                        <div>
                          <input
                            type="text"
                            placeholder="Customization notes (e.g. gold foil name, dried rosebuds)"
                            value={item.customizationNotes || ''}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].customizationNotes = e.target.value;
                              setItems(newItems);
                            }}
                            className="w-full p-1 text-[11px] bg-stone-50 border border-stone-200 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Customization fee (₹)"
                            value={item.customizationCharge || ''}
                            onChange={(e) => handleItemCustomChargeChange(index, Number(e.target.value))}
                            className="w-full p-1 text-[11px] bg-stone-50 border border-stone-200 rounded font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxation & Charges */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <label className="block text-stone-600 mb-1">Packaging (₹)</label>
                  <input
                    type="number"
                    value={packagingCharge}
                    onChange={(e) => setPackagingCharge(Number(e.target.value))}
                    className="w-full p-1.5 bg-white border border-stone-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Shipping (₹)</label>
                  <input
                    type="number"
                    value={shippingCharge}
                    onChange={(e) => setShippingCharge(Number(e.target.value))}
                    className="w-full p-1.5 bg-white border border-stone-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full p-1.5 bg-white border border-stone-200 rounded font-mono text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">GST Tax</label>
                  <select
                    value={gstType}
                    onChange={(e) => setGstType(e.target.value as any)}
                    className="w-full p-1.5 bg-white border border-stone-200 rounded text-xs"
                  >
                    <option value="CGST_SGST">18% CGST + SGST</option>
                    <option value="IGST">18% IGST (Inter-state)</option>
                    <option value="NONE">Tax Exempt (0%)</option>
                  </select>
                </div>
              </div>

              {/* Calculation Summary Footer */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-stone-600">Subtotal: {formatCurrency(totals.taxableSubtotal)}</div>
                  <div className="text-stone-600">
                    GST ({gstType === 'NONE' ? 0 : gstRatePercent}%): {formatCurrency(totals.gstAmount)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-stone-500">Grand Total:</div>
                  <div className="font-mono text-lg font-bold text-stone-900">
                    {formatCurrency(totals.grandTotal)}
                  </div>
                  <div className="text-[11px] text-amber-900 font-semibold font-mono">
                    50% Advance: {formatCurrency(totals.advanceRequired)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs"
                >
                  Save & Generate PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branded PDF Preview Modal */}
      {activeQuotationForPdf && (
        <QuotationPdfModal
          quotation={activeQuotationForPdf}
          onClose={() => setActiveQuotationForPdf(null)}
        />
      )}

      {/* Stage Media & Attachments Vault Modal */}
      {selectedQuotationForAttachments && (
        <StageAttachmentsModal
          isOpen={Boolean(selectedQuotationForAttachments)}
          onClose={() => setSelectedQuotationForAttachments(null)}
          stage="Quotation"
          entity={selectedQuotationForAttachments}
        />
      )}
    </div>
  );
};
