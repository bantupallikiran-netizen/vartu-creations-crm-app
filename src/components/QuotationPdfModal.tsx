import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { Quotation, CrmDocument } from '../types.ts';
import { formatCurrency } from '../utils/calculations.ts';
import { Printer, Download, X, CheckCircle, Share2, Paperclip, ExternalLink, Image, Film, FileText } from 'lucide-react';

interface QuotationPdfModalProps {
  quotation: Quotation;
  onClose: () => void;
}

export const QuotationPdfModal: React.FC<QuotationPdfModalProps> = ({ quotation, onClose }) => {
  const { settings, convertQuotationToOrder, documents, shareDocument } = useCrm();

  const handlePrint = () => {
    window.print();
  };

  const handleConvertToOrder = () => {
    const order = convertQuotationToOrder(quotation.id);
    if (order) {
      alert(`Quotation successfully converted to Order ${order.orderNumber}!`);
      onClose();
    }
  };

  const attachedDocs = documents.filter(
    (d) => d.linkedEntityId === quotation.id || (d.stage === 'Quotation' && d.linkedEntityNumber === quotation.quotationNumber)
  );

  const cleanPhone = quotation.customerMobile.replace(/\D/g, '');
  const docSummary = attachedDocs.length > 0 ? `\nAttached specs/mockups: ${attachedDocs.map((d) => d.name).join(', ')}` : '';
  const waShareUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Namaste ${quotation.customerName}! Here is your formal quotation ${quotation.quotationNumber} from Vartu Creations for ₹${quotation.grandTotal}.${docSummary}\n50% advance locks in your studio production slot.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between p-4 bg-stone-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm">Vartu Creations Quotation Document</span>
            <span className="text-xs text-stone-400 font-mono">({quotation.quotationNumber})</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp PDF</span>
            </a>

            {quotation.status !== 'Accepted' && (
              <button
                onClick={handleConvertToOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-600 rounded-lg transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Convert to Order</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Sheet */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 bg-white text-stone-900 print:p-0 print:overflow-visible">
          {/* Header & Logo */}
          <div className="flex items-start justify-between border-b border-stone-200 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-serif text-xl font-bold">
                  V
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
                    {settings.businessName}
                  </h1>
                  <p className="text-xs text-amber-800 font-medium">{settings.tagline}</p>
                </div>
              </div>

              <div className="mt-3 text-xs text-stone-600 space-y-0.5">
                <div>{settings.address}</div>
                <div>
                  {settings.city}, {settings.state} - {settings.pincode}
                </div>
                <div>
                  WhatsApp/Phone: <span className="font-mono">{settings.whatsapp}</span> · Web: {settings.website}
                </div>
                <div>
                  Instagram: <span className="font-medium">{settings.instagram}</span> · GSTIN:{' '}
                  <span className="font-mono font-semibold">{settings.gstin}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-serif font-bold text-xs uppercase tracking-wider rounded">
                Official Quotation
              </span>
              <div className="mt-3 font-mono font-bold text-sm text-stone-900">{quotation.quotationNumber}</div>
              <div className="text-xs text-stone-500 mt-1">Date: {quotation.quotationDate}</div>
              <div className="text-xs text-stone-500">Valid Until: {quotation.validUntil}</div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Billed / Quoted To:</span>
              <div className="font-bold text-sm text-stone-900 mt-0.5">{quotation.customerName}</div>
              <div className="text-stone-600 mt-1">{quotation.customerAddress}</div>
              <div className="font-mono text-stone-600 mt-0.5">Contact: {quotation.customerMobile}</div>
              {quotation.customerEmail && <div className="text-stone-600">{quotation.customerEmail}</div>}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Terms & Timeline:</span>
              <div className="text-stone-700 mt-1">
                <strong>Delivery Timeline:</strong> {quotation.deliveryTimeline}
              </div>
              <div className="text-stone-700 mt-1">
                <strong>Payment Terms:</strong> 50% Advance to commence production, 50% balance before dispatch.
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-6 border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 text-stone-700 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Product Description & Specs</th>
                  <th className="py-2.5 px-3 text-center">SKU</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {quotation.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 text-stone-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-900">{item.productName}</div>
                      {item.customizationNotes && (
                        <div className="text-[11px] text-amber-800 mt-0.5 italic">
                          Customization: {item.customizationNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-stone-500">{item.sku}</td>
                    <td className="py-3 px-3 text-right font-mono font-medium">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-stone-900">
                      {formatCurrency(item.itemTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation Block */}
          <div className="mt-6 flex justify-end">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal (Items):</span>
                <span className="font-mono">{formatCurrency(quotation.subtotal)}</span>
              </div>

              {quotation.packagingCharge > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Luxury Craft Packaging:</span>
                  <span className="font-mono">+{formatCurrency(quotation.packagingCharge)}</span>
                </div>
              )}

              {quotation.shippingCharge > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Shipping & Fragile Insurance:</span>
                  <span className="font-mono">+{formatCurrency(quotation.shippingCharge)}</span>
                </div>
              )}

              {quotation.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Promotional Discount:</span>
                  <span className="font-mono">-{formatCurrency(quotation.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>GST ({quotation.gstRatePercent}% {quotation.gstType}):</span>
                <span className="font-mono">+{formatCurrency(quotation.gstAmount)}</span>
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-stone-900">
                <span>Grand Total:</span>
                <span className="font-mono text-base">{formatCurrency(quotation.grandTotal)}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] space-y-1">
                <div className="flex justify-between font-semibold text-amber-900">
                  <span>50% Advance Required:</span>
                  <span className="font-mono">{formatCurrency(quotation.advanceRequired)}</span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Balance Due on Dispatch:</span>
                  <span className="font-mono">{formatCurrency(quotation.balanceAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attached Design Renders & Specs (Quotation Stage) */}
          {attachedDocs.length > 0 && (
            <div className="mt-5 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-stone-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-700" />
                  Attached Design Mockups & Technical Specs ({attachedDocs.length})
                </span>
                <span className="text-[10px] text-stone-400">Stored in Documents Vault</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {attachedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2 rounded-lg bg-white border border-stone-200 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {doc.fileType === 'video' ? (
                        <Film className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : doc.fileType === 'image' ? (
                        <Image className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-semibold text-stone-800 truncate text-[11px]">{doc.name}</div>
                        <div className="text-[10px] text-stone-400">{doc.category} • {doc.size}</div>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-stone-400 hover:text-stone-800 transition-colors"
                      title="Open attachment"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank & Payment Info */}
          <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-stone-900 text-[11px] uppercase tracking-wider">
                Bank Transfer / UPI Details
              </span>
              <div className="text-stone-600 mt-1 space-y-0.5">
                <div>Bank: {settings.bankName}</div>
                <div>Account No: <span className="font-mono font-semibold">{settings.bankAccount}</span></div>
                <div>IFSC Code: <span className="font-mono font-semibold">{settings.bankIfsc}</span></div>
                <div>UPI ID: <span className="font-mono font-semibold text-amber-900">{settings.bankUpi}</span></div>
              </div>
            </div>

            <div>
              <span className="font-bold text-stone-900 text-[11px] uppercase tracking-wider">
                Artisan Terms & Conditions
              </span>
              <div className="text-[11px] text-stone-500 whitespace-pre-wrap mt-1 leading-relaxed">
                {quotation.termsAndConditions}
              </div>
            </div>
          </div>

          {/* Signature Footer */}
          <div className="mt-8 pt-6 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <div>Thank you for supporting authentic handmade Indian crafts!</div>
            <div className="text-right">
              <div className="font-serif font-bold text-stone-900 text-sm">For Vartu Creations</div>
              <div className="text-[10px] text-stone-400 mt-4">Authorized Signature & Seal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
