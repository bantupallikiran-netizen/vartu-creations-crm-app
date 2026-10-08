import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { Lead, LeadSource, LeadStatus, Priority } from '../types.ts';
import { formatCurrency } from '../utils/calculations.ts';
import {
  Search,
  Filter,
  Plus,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Calendar,
  Tag,
  CheckCircle2,
  X,
  FileText,
  Clock,
  User,
  Paperclip,
  Film,
} from 'lucide-react';
import { StageAttachmentsModal } from './StageAttachmentsModal.tsx';

export const LeadsView: React.FC = () => {
  const {
    leads,
    addLead,
    updateLead,
    deleteLead,
    products,
    setQuickAction,
    setActiveTab,
    addFollowUp,
    documents,
  } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadForAttachments, setSelectedLeadForAttachments] = useState<Lead | null>(null);

  // AI Summary Drawer State
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobile.includes(searchTerm) ||
      lead.leadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.companyName && lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.leadSource === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleAiLeadSummary = async (lead: Lead) => {
    setSelectedLead(lead);
    setShowAiModal(true);
    setAiSummaryLoading(true);
    setAiSummaryData(null);

    try {
      const response = await fetch('/api/ai/lead-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          products: lead.productInterest,
          notes: lead.remarks,
        }),
      });
      const res = await response.json();
      if (res.success) {
        setAiSummaryData(res.data);
      } else {
        setAiSummaryData({
          requirement: 'Customer interested in ' + lead.productInterest.join(', '),
          buyingIntent: lead.priority === 'Urgent' ? 'High' : 'Medium',
          estimatedBudget: lead.expectedBudget ? `₹${lead.expectedBudget}` : 'Under evaluation',
          urgency: lead.priority,
          keyObjections: ['Confirming customization specifications', 'Timeline validation'],
          recommendedAction: 'Send tailored quotation with sample images.',
          whatsappDraft: `Hi ${lead.customerName}, thank you for connecting with Vartu Creations! We would love to handcraft your custom order.`,
        });
      }
    } catch (err) {
      console.error(err);
      setAiSummaryData({
        requirement: lead.customizationNotes || 'Customer inquiry',
        buyingIntent: 'Medium',
        estimatedBudget: `₹${lead.expectedBudget || 1000}`,
        urgency: lead.priority,
        keyObjections: ['Pending formal quotation review'],
        recommendedAction: 'Follow up on WhatsApp with product catalog.',
        whatsappDraft: `Hi ${lead.customerName}, greetings from Vartu Creations! Sharing details for your order.`,
      });
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleQuickFollowUp = (lead: Lead) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    addFollowUp({
      entityType: 'Lead',
      entityId: lead.id,
      customerName: lead.customerName,
      contactNumber: lead.whatsapp || lead.mobile,
      scheduledDate: tomorrow,
      title: `Follow up with ${lead.customerName} on ${lead.productInterest[0] || 'order inquiry'}`,
      priority: lead.priority,
      status: 'Pending',
      notes: lead.remarks,
    });
    alert(`Follow-up scheduled for tomorrow with ${lead.customerName}!`);
  };

  const allStatuses: LeadStatus[] = [
    'New',
    'Contacted',
    'Interested',
    'Requirement Received',
    'Quotation Required',
    'Quotation Sent',
    'Negotiation',
    'Advance Pending',
    'Order Confirmed',
    'Not Interested',
    'Lost',
    'On Hold',
  ];

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Inbound Leads & Opportunities</h2>
          <p className="text-xs text-stone-500">
            {leads.length} inquiries captured from Instagram, WhatsApp, Meesho & Direct Referrals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuickAction('newLead')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, mobile, lead ID, company..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 focus:bg-white text-stone-800"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none"
          >
            <option value="all">All Statuses ({leads.length})</option>
            {allStatuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="Instagram">Instagram</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Referral">Referral</option>
            <option value="Website">Website</option>
            <option value="Meesho">Meesho</option>
            <option value="Exhibition">Exhibition</option>
          </select>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Lead ID & Customer</th>
                <th className="py-3 px-4">Contact & Channel</th>
                <th className="py-3 px-4">Product Interest & Qty</th>
                <th className="py-3 px-4">Expected Budget</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLeads.map((lead) => {
                const cleanPhone = lead.whatsapp.replace(/\D/g, '');
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Namaste ${lead.customerName}! Greetings from Vartu Creations. Following up on your inquiry for ${
                    lead.productInterest[0] || 'our handmade craft products'
                  }.`
                )}`;

                return (
                  <tr key={lead.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{lead.customerName}</div>
                      <div className="text-[11px] text-stone-400 font-mono mt-0.5">{lead.leadNumber}</div>
                      {lead.companyName && (
                        <div className="text-[10px] text-amber-800 font-medium">{lead.companyName}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-stone-700 font-mono">{lead.mobile}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                        <span className="font-medium text-stone-600">{lead.leadSource}</span>
                        {lead.instagramId && <span>· {lead.instagramId}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="truncate font-medium text-stone-900">
                        {lead.productInterest.join(', ') || 'General Enquiry'}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-semibold text-stone-700">{lead.quantity} pcs</span>
                        {lead.customizationRequired && (
                          <span className="text-amber-700 font-medium">· Customization Req.</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-stone-900">
                        {lead.expectedBudget ? formatCurrency(lead.expectedBudget) : '—'}
                      </div>
                      {lead.expectedDeliveryDate && (
                        <div className="text-[10px] text-stone-400 mt-0.5">Due: {lead.expectedDeliveryDate}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLead(lead.id, { status: e.target.value as LeadStatus })}
                        className="text-[11px] font-medium px-2 py-1 bg-stone-100 border border-stone-200 rounded-md text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-700"
                      >
                        {allStatuses.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                          lead.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : lead.priority === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : lead.priority === 'Medium'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {lead.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Attachments / Media CTA */}
                        {(() => {
                          const docCount = documents.filter(
                            (d) => d.linkedEntityId === lead.id || (d.stage === 'Lead' && d.linkedEntityNumber === lead.leadNumber)
                          ).length;
                          return (
                            <button
                              onClick={() => setSelectedLeadForAttachments(lead)}
                              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                                docCount > 0
                                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                              title="Attach & Share Images/Videos/Docs (Stored in Documents)"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>Media{docCount > 0 ? ` (${docCount})` : ''}</span>
                            </button>
                          );
                        })()}

                        {/* WhatsApp CTA */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>

                        {/* Call CTA */}
                        <a
                          href={`tel:${lead.mobile}`}
                          className="p-1.5 text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
                          title="Call Lead"
                        >
                          <Phone className="w-4 h-4" />
                        </a>

                        {/* AI Summary CTA */}
                        <button
                          onClick={() => handleAiLeadSummary(lead)}
                          className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                          title="Generate AI Lead Intelligence"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        {/* Quick Follow-up */}
                        <button
                          onClick={() => handleQuickFollowUp(lead)}
                          className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Schedule Follow-up"
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        {/* Convert to Quotation */}
                        <button
                          onClick={() => {
                            setQuickAction('newQuotation');
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors whitespace-nowrap"
                        >
                          Quote
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-500">
                    No leads match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Lead Summary Modal */}
      {showAiModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  AI Lead Analysis: {selectedLead.customerName}
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiSummaryLoading ? (
              <div className="py-12 text-center space-y-2">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
                <p className="text-xs text-stone-500">Gemini analyzing requirements, budget & sales strategy...</p>
              </div>
            ) : aiSummaryData ? (
              <div className="space-y-4 text-xs">
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="font-semibold text-amber-950 flex items-center justify-between">
                    <span>Customer Requirement</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200/60 text-amber-900">
                      Intent: {aiSummaryData.buyingIntent || 'High'}
                    </span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">{aiSummaryData.requirement}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[11px] text-stone-400 font-medium">Estimated Budget</span>
                    <div className="font-mono font-bold text-stone-900 mt-1">{aiSummaryData.estimatedBudget}</div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[11px] text-stone-400 font-medium">Urgency & Timeline</span>
                    <div className="font-bold text-stone-900 mt-1">{aiSummaryData.urgency || selectedLead.priority}</div>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <span className="font-semibold text-stone-900">Recommended Sales Action:</span>
                  <p className="text-stone-600 leading-relaxed">{aiSummaryData.recommendedAction}</p>
                </div>

                {aiSummaryData.whatsappDraft && (
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        Ready WhatsApp Copy
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiSummaryData.whatsappDraft);
                          alert('Message copied to clipboard!');
                        }}
                        className="text-[10px] font-semibold text-emerald-800 hover:underline"
                      >
                        Copy Text
                      </button>
                    </div>
                    <p className="text-stone-700 whitespace-pre-wrap text-[11px] bg-white p-2.5 rounded-lg border border-emerald-100">
                      {aiSummaryData.whatsappDraft}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAiModal(false)}
                    className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
                  >
                    Close
                  </button>
                  <a
                    href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                      aiSummaryData.whatsappDraft || ''
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                  >
                    Open in WhatsApp
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Stage Attachments & Media Modal */}
      {selectedLeadForAttachments && (
        <StageAttachmentsModal
          isOpen={Boolean(selectedLeadForAttachments)}
          onClose={() => setSelectedLeadForAttachments(null)}
          stage="Lead"
          entity={selectedLeadForAttachments}
        />
      )}
    </div>
  );
};
