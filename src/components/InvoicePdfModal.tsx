import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { Invoice } from '../types.ts';
import { formatCurrency } from '../utils/calculations.ts';
import {
  Printer,
  X,
  Share2,
  CheckCircle,
  Copy,
  CreditCard,
  Mail,
  Building2,
  Phone,
  QrCode,
  AlertCircle,
  Check,
} from 'lucide-react';

interface InvoicePdfModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({ invoice, onClose }) => {
  const { settings, addPayment, orders } = useCrm();
  const [copied, setCopied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(invoice.balanceDue > 0 ? invoice.balanceDue : 0);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Bank Transfer' | 'Cash' | 'Card'>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState(`Payment for Invoice ${invoice.invoiceNumber}`);
  const [isRecording, setIsRecording] = useState(false);

  const cleanPhone = (invoice.customerMobile || '').replace(/\D/g, '');
  const waShareText = `Namaste ${invoice.customerName}! 🙏\n\nHere is your Tax Invoice *${invoice.invoiceNumber}* for Order *${invoice.orderNumber}* from *Vartu Creations*.\n\n` +
    `• Invoice Total: ${formatCurrency(invoice.grandTotal)}\n` +
    `• Amount Paid: ${formatCurrency(invoice.amountPaid)}\n` +
    `• Balance Due: ${formatCurrency(invoice.balanceDue)}\n` +
    `• Status: ${invoice.status.toUpperCase()}\n\n` +
    `UPI Payment ID: ${settings.bankUpi}\n` +
    `Bank IFSC: ${settings.bankIfsc} | A/C: ${settings.bankAccount}\n\n` +
    `Thank you for patronizing handcrafted resin & artisan creations!`;

  const waShareUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waShareText)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(waShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleRecordInvoicePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    setIsRecording(true);
    try {
      addPayment({
        orderId: invoice.orderId,
        orderNumber: invoice.orderNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        amount: Number(paymentAmount),
        paymentDate: new Date().toISOString().split('T')[0],
        mode: paymentMode,
        transactionRef: paymentRef.trim() || `UTR/${Date.now().toString().slice(-6)}`,
        status: 'Completed',
        notes: paymentNotes.trim() || `Payment for Invoice ${invoice.invoiceNumber}`,
      });

      setShowPaymentModal(false);
    } catch (err) {
      console.error('Failed to record payment on invoice:', err);
    } finally {
      setIsRecording(false);
    }
  };

  // Find linked order items if invoice doesn't have custom items
  const linkedOrder = orders.find((o) => o.id === invoice.orderId);
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : (linkedOrder?.items || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-stone-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm">Vartu Creations Tax Invoice</span>
            <span className="text-xs text-stone-400 font-mono">({invoice.invoiceNumber})</span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : invoice.status === 'Partially Paid'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {invoice.balanceDue > 0 && (
              <button
                onClick={() => {
                  setPaymentAmount(invoice.balanceDue);
                  setShowPaymentModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Record immediate payment against this invoice"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
              title="Share invoice summary on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
              title="Copy invoice details to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg ml-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Document */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 font-sans text-stone-900 bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-stone-900">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-stone-900 text-stone-100 font-serif font-bold flex items-center justify-center text-base">
                  V
                </div>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
                  {settings.businessName}
                </h1>
              </div>
              <p className="text-xs text-stone-600 mt-2 max-w-sm font-serif italic">
                {settings.tagline}
              </p>
              <div className="text-[11px] text-stone-600 mt-2 leading-relaxed">
                <div>{settings.address}</div>
                <div>{settings.city}, {settings.state} - {settings.pincode}</div>
                <div>Email: {settings.email} | Mobile: {settings.phone}</div>
                <div className="font-mono font-medium text-stone-800 mt-1">
                  GSTIN: {settings.gstin} | PAN: {settings.panNumber || 'AAACV1234F'}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-stone-900 text-white rounded">
                Tax Invoice
              </span>
              <div className="mt-3 font-mono text-sm font-bold text-stone-900">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-stone-600 mt-1 space-y-0.5">
                <div>Invoice Date: <strong className="font-mono">{invoice.invoiceDate}</strong></div>
                <div>Due Date: <strong className="font-mono">{invoice.dueDate}</strong></div>
                <div>Order Ref: <strong className="font-mono text-amber-900">{invoice.orderNumber}</strong></div>
              </div>
            </div>
          </div>

          {/* Bill-To Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-stone-200 text-xs">
            <div>
              <span className="font-bold text-stone-500 uppercase text-[10px] tracking-wider block mb-1">
                Billed To (Client / Customer):
              </span>
              <div className="font-bold text-sm text-stone-900">{invoice.customerName}</div>
              {invoice.customerMobile && (
                <div className="text-stone-600 font-mono mt-0.5">Phone: {invoice.customerMobile}</div>
              )}
              {invoice.customerEmail && (
                <div className="text-stone-600 mt-0.5">Email: {invoice.customerEmail}</div>
              )}
              <div className="text-stone-600 mt-1 max-w-xs leading-relaxed">
                {invoice.billingAddress || 'Studio Handover / Hyderabad Pickup'}
              </div>
              {invoice.customerGstin && (
                <div className="mt-1 font-mono font-semibold text-stone-900">
                  Client GSTIN: {invoice.customerGstin}
                </div>
              )}
            </div>

            <div className="sm:text-right flex flex-col justify-between">
              <div>
                <span className="font-bold text-stone-500 uppercase text-[10px] tracking-wider block mb-1">
                  Payment Status
                </span>
                <div className="inline-block">
                  <span
                    className={`text-xs font-bold uppercase px-3 py-1 rounded-md ${
                      invoice.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-900'
                        : invoice.status === 'Partially Paid'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-stone-600">
                Place of Supply: <strong>{invoice.billingAddress?.includes('Telangana') ? 'Telangana (36)' : 'Inter-State'}</strong>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6 border-b border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-800 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description & Specifications</th>
                  <th className="py-2.5 px-3 text-center">HSN/SAC</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {items.map((item: any, idx: number) => {
                  const qty = item.quantity || 1;
                  const unitRate = item.unitPrice || 0;
                  const itemTotal = item.total || unitRate * qty;
                  const customText =
                    item.customizationDetails?.nameText ||
                    item.customizationDetails?.specialInstructions ||
                    item.customizationDetails;

                  return (
                    <tr key={idx} className="align-top">
                      <td className="py-3 px-3 font-mono text-stone-500 text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-900">{item.productName}</div>
                        {item.sku && (
                          <div className="text-[10px] font-mono text-stone-500 mt-0.5">SKU: {item.sku}</div>
                        )}
                        {customText && (
                          <div className="text-[10px] text-amber-900 bg-amber-50/80 px-2 py-0.5 rounded mt-1 border border-amber-200/60 inline-block">
                            Artisan Customization: {String(customText)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-stone-500 text-[11px]">9703</td>
                      <td className="py-3 px-3 text-center font-mono font-semibold">{qty}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrency(unitRate)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                        {formatCurrency(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Totals */}
          <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-stone-200">
            {/* Bank Details & UPI QR info */}
            <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
              <span className="font-bold text-stone-900 uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                Bank Transfer & UPI Settlement Details
              </span>
              <div className="space-y-1 text-stone-700 font-mono text-[11px]">
                <div>Beneficiary: <strong>{settings.businessName}</strong></div>
                <div>Bank: <strong>{settings.bankName}</strong></div>
                <div>Account No: <strong>{settings.bankAccount}</strong></div>
                <div>IFSC Code: <strong>{settings.bankIfsc}</strong></div>
                <div className="text-emerald-800 font-bold pt-1">
                  UPI ID: <span>{settings.bankUpi}</span>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 italic">
                * Please quote invoice #{invoice.invoiceNumber} in transaction remarks.
              </p>
            </div>

            {/* Calculations Table */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100 text-stone-600">
                <span>Taxable Subtotal:</span>
                <span className="font-mono font-medium text-stone-900">{formatCurrency(invoice.subtotal)}</span>
              </div>

              {invoice.cgst > 0 && (
                <div className="flex justify-between py-1 border-b border-stone-100 text-stone-600">
                  <span>Central GST (CGST 9%):</span>
                  <span className="font-mono text-stone-800">{formatCurrency(invoice.cgst)}</span>
                </div>
              )}

              {invoice.sgst > 0 && (
                <div className="flex justify-between py-1 border-b border-stone-100 text-stone-600">
                  <span>State GST (SGST 9%):</span>
                  <span className="font-mono text-stone-800">{formatCurrency(invoice.sgst)}</span>
                </div>
              )}

              {invoice.igst > 0 && (
                <div className="flex justify-between py-1 border-b border-stone-100 text-stone-600">
                  <span>Integrated GST (IGST 18%):</span>
                  <span className="font-mono text-stone-800">{formatCurrency(invoice.igst)}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-y-2 border-stone-900 text-sm font-bold text-stone-900">
                <span>Invoice Grand Total:</span>
                <span className="font-mono text-base">{formatCurrency(invoice.grandTotal)}</span>
              </div>

              {/* Payments & Net Balance */}
              <div className="flex justify-between py-1.5 text-emerald-800 font-medium">
                <span>Total Amount Paid / Settled:</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.amountPaid)}</span>
              </div>

              <div
                className={`flex justify-between py-2 px-3 rounded-lg font-bold ${
                  invoice.balanceDue > 0
                    ? 'bg-rose-50 text-rose-900 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                }`}
              >
                <span>Net Balance Due:</span>
                <span className="font-mono text-base">{formatCurrency(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Footer */}
          <div className="pt-6 text-[11px] text-stone-600 space-y-2">
            <span className="font-bold text-stone-800 uppercase text-[10px] tracking-wider block">
              Terms & Conditions:
            </span>
            <div className="whitespace-pre-line leading-relaxed text-stone-500 font-mono text-[10px]">
              {invoice.termsAndConditions ||
                '1. Handmade goods are crafted uniquely to order specifications.\n2. Goods once crafted and approved cannot be returned or refunded.\n3. Balance settlement required prior to delivery.'}
            </div>

            <div className="pt-6 flex justify-between items-end border-t border-stone-100 mt-6">
              <div className="text-[10px] text-stone-400">
                This is a computer-generated tax invoice generated via Vartu Creations CRM.
              </div>
              <div className="text-right">
                <div className="text-xs font-serif font-bold text-stone-900">{settings.businessName}</div>
                <div className="text-[10px] text-stone-500 mt-0.5">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-stone-900">Record Payment for {invoice.invoiceNumber}</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordInvoicePayment} className="space-y-3 text-xs">
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-stone-700 flex justify-between">
                <span>Invoice Total: <strong>{formatCurrency(invoice.grandTotal)}</strong></span>
                <span>Current Balance: <strong className="text-rose-700">{formatCurrency(invoice.balanceDue)}</strong></span>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Payment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max={invoice.balanceDue > 0 ? invoice.balanceDue : undefined}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono font-bold text-sm text-emerald-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg"
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                    <option value="Cash">Cash at Studio</option>
                    <option value="Card">Card / POS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">UTR / Transaction Ref</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. UTR-491028"
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Notes / Receipt Description</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Final balance settlement via UPI"
                  className="w-full p-2 bg-white border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecording || paymentAmount <= 0}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isRecording ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
