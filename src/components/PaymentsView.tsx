import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { Invoice, Payment } from '../types.ts';
import { formatCurrency } from '../utils/calculations.ts';
import { InvoicePdfModal } from './InvoicePdfModal.tsx';
import { CreateInvoiceModal } from './CreateInvoiceModal.tsx';
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  Eye,
  Share2,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { payments, orders, invoices, setQuickAction, setActiveTab } = useCrm();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTabSub, setActiveTabSub] = useState<'payments' | 'invoices'>('payments');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalOutstanding = orders.reduce((acc, o) => acc + (o.balanceAmount || 0), 0);

  const filteredPayments = payments.filter((p) => {
    return (
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transactionRef.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredInvoices = invoices.filter((i) => {
    return (
      i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Financial Ledger & Invoices</h2>
          <p className="text-xs text-stone-500">
            Track advance payments, UPI receipts, bank transfers, outstanding client balances & Indian GST invoices.
          </p>
        </div>

        <button
          onClick={() => setQuickAction('newPayment')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Record Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Collected (Cash Flow)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-2">
            {formatCurrency(totalCollected)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">{payments.length} verified transactions</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Outstanding Balances</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-800 mt-2">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Pending receipt upon order dispatch</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">GST Invoices Issued</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-stone-900 mt-2">{invoices.length}</div>
          <div className="text-[11px] text-stone-400 mt-1">Compliant CGST/SGST/IGST tax invoices</div>
        </div>
      </div>

      {/* Segmented Sub Tabs */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search receipt, UTR reference, customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 text-stone-800"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
          <button
            onClick={() => setActiveTabSub('payments')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTabSub === 'payments' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Payments & Receipts ({payments.length})
          </button>
          <button
            onClick={() => setActiveTabSub('invoices')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTabSub === 'invoices' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Tax Invoices ({invoices.length})
          </button>
        </div>
      </div>

      {/* Payments Table */}
      {activeTabSub === 'payments' ? (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Linked Order</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">UTR / Transaction Ref</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-stone-900">{p.receiptNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{p.customerName}</div>
                      {p.notes && <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-1 italic">{p.notes}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-amber-900">
                      {p.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-stone-100 font-medium text-stone-700">
                        {p.mode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                      {p.transactionRef}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-stone-500">
                      {p.paymentDate}
                    </td>
                  </tr>
                ))}

                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-stone-500">
                      No payment entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Invoices Table */
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Billed Customer & GSTIN</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Taxable Subtotal</th>
                  <th className="py-3 px-4">GST (CGST/SGST/IGST)</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-amber-900 hover:text-amber-700 hover:underline cursor-pointer block text-left"
                      >
                        {inv.invoiceNumber}
                      </button>
                      <div className="text-[10px] text-stone-400 font-normal mt-0.5">Date: {inv.invoiceDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{inv.customerName}</div>
                      {inv.customerGstin && (
                        <div className="text-[10px] font-mono text-stone-500 mt-0.5">GSTIN: {inv.customerGstin}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-700">{inv.orderNumber}</td>
                    <td className="py-3 px-4 font-mono">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3 px-4 font-mono text-stone-600 text-[11px]">
                      {inv.cgst > 0 && `CGST ₹${inv.cgst} + SGST ₹${inv.sgst}`}
                      {inv.igst > 0 && `IGST ₹${inv.igst}`}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md cursor-pointer"
                          title="View & Share Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('invoices');
                          }}
                          className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-md cursor-pointer"
                          title="Open Full Invoices Module"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-stone-500">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedInvoice && (
        <InvoicePdfModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      {showCreateInvoice && (
        <CreateInvoiceModal onClose={() => setShowCreateInvoice(false)} />
      )}
    </div>
  );
};
