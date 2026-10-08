import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { Invoice } from '../types.ts';
import { formatCurrency } from '../utils/calculations.ts';
import { InvoicePdfModal } from './InvoicePdfModal.tsx';
import { CreateInvoiceModal } from './CreateInvoiceModal.tsx';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  CreditCard,
  Share2,
  Printer,
  Eye,
  AlertCircle,
  FileCheck,
  Send,
  X,
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const { invoices, orders, settings, addPayment } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partially Paid' | 'Issued' | 'Draft'>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Quick payment modal state directly from ledger row
  const [quickPayInvoice, setQuickPayInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState<'UPI' | 'Bank Transfer' | 'Cash' | 'Card'>('UPI');
  const [payRef, setPayRef] = useState('');

  // Financial KPI calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalBalanceDue = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
  const paidInvoicesCount = invoices.filter((inv) => inv.status === 'Paid').length;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customerGstin && inv.customerGstin.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenQuickPay = (inv: Invoice) => {
    setQuickPayInvoice(inv);
    setPayAmount(inv.balanceDue > 0 ? inv.balanceDue : 0);
    setPayRef(`UPI/${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmQuickPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayInvoice || payAmount <= 0) return;

    addPayment({
      orderId: quickPayInvoice.orderId,
      orderNumber: quickPayInvoice.orderNumber,
      customerId: quickPayInvoice.customerId,
      customerName: quickPayInvoice.customerName,
      amount: Number(payAmount),
      paymentDate: new Date().toISOString().split('T')[0],
      mode: payMode,
      transactionRef: payRef.trim() || `UTR/${Date.now().toString().slice(-6)}`,
      status: 'Completed',
      notes: `Settlement for Invoice ${quickPayInvoice.invoiceNumber}`,
    });

    setQuickPayInvoice(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <span>Tax Invoices & Billing Module</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono font-medium">
              {invoices.length} Invoices
            </span>
          </h2>
          <p className="text-xs text-stone-500">
            Generate compliant GST invoices from client orders, share via WhatsApp, and track real-time payment auto-reconciliation.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Generate Invoice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Invoiced Amount</span>
            <FileText className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-xl font-bold font-mono text-stone-900 mt-2">
            {formatCurrency(totalInvoiced)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">{invoices.length} invoices generated</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Payments Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-2">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">{paidInvoicesCount} fully settled</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Outstanding Invoiced Balance</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-800 mt-2">
            {formatCurrency(totalBalanceDue)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Pending client settlements</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Settlement Rate</span>
            <FileCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-900 mt-2">
            {invoices.length > 0 ? Math.round((paidInvoicesCount / invoices.length) * 100) : 0}%
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Auto-updated on payment</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, customer, order #, GSTIN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 text-stone-800"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-stone-100 rounded-lg">
          {(['All', 'Paid', 'Partially Paid', 'Issued', 'Draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Ledger Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice # & Date</th>
                <th className="py-3 px-4">Billed Client</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredInvoices.map((inv) => {
                const cleanPhone = (inv.customerMobile || '').replace(/\D/g, '');
                const waShareText = `Namaste ${inv.customerName}! 🙏 Please find Tax Invoice ${inv.invoiceNumber} from Vartu Creations. Total: ${formatCurrency(inv.grandTotal)}, Balance Due: ${formatCurrency(inv.balanceDue)}. UPI: ${settings.bankUpi}`;
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waShareText)}`;

                return (
                  <tr key={inv.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="font-mono font-bold text-amber-900 hover:text-amber-700 hover:underline cursor-pointer block text-left"
                      >
                        {inv.invoiceNumber}
                      </button>
                      <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                        Dated: {inv.invoiceDate} · Due: {inv.dueDate}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{inv.customerName}</div>
                      {inv.customerGstin && (
                        <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                          GSTIN: {inv.customerGstin}
                        </div>
                      )}
                      {inv.customerMobile && (
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                          {inv.customerMobile}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-stone-700">
                      <span className="px-2 py-0.5 bg-stone-100 rounded text-[11px] font-medium">
                        {inv.orderNumber}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 text-sm">
                      {formatCurrency(inv.grandTotal)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-emerald-800">
                      {formatCurrency(inv.amountPaid)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={inv.balanceDue > 0 ? 'text-rose-800' : 'text-stone-400'}>
                        {formatCurrency(inv.balanceDue)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : inv.status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          title="View & Share Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </a>

                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => handleOpenQuickPay(inv)}
                            className="p-1.5 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            title="Record Payment against Invoice"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-stone-300" />
                      <p className="text-xs font-medium text-stone-600">No invoices match your search.</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-xs text-amber-700 hover:underline font-semibold"
                      >
                        + Generate a new invoice
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedInvoice && (
        <InvoicePdfModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      {showCreateModal && (
        <CreateInvoiceModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Quick Pay Modal from Table */}
      {quickPayInvoice && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-stone-900">Record Payment</h3>
              </div>
              <button
                onClick={() => setQuickPayInvoice(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuickPayment} className="space-y-3 text-xs">
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <div className="font-semibold text-stone-900">{quickPayInvoice.customerName}</div>
                <div className="text-stone-500 text-[11px] font-mono">{quickPayInvoice.invoiceNumber}</div>
                <div className="flex justify-between items-center mt-2 pt-1 border-t border-stone-200 text-[11px]">
                  <span>Remaining Due:</span>
                  <strong className="text-rose-700 font-mono text-xs">
                    {formatCurrency(quickPayInvoice.balanceDue)}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Payment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono font-bold text-emerald-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">UTR / Ref</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setQuickPayInvoice(null)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payAmount <= 0}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
