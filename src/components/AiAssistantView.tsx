import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import {
  Sparkles,
  Send,
  MessageSquare,
  Gift,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export const AiAssistantView: React.FC = () => {
  const { leads, orders, customers, products, quotations, inventory, followUps } = useCrm();

  const [activeTab, setActiveTab] = useState<'copilot' | 'followup' | 'recommend' | 'risk'>('copilot');

  // Co-pilot Chat State
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Namaste! I am your AI Sales & Operations Co-pilot for Vartu Creations. I have live access to your leads, orders, inventory, margins, and customer data. Ask me anything, or try one of the quick queries below!',
    },
  ]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Follow-up Generator State
  const [targetChannel, setTargetChannel] = useState('WhatsApp');
  const [targetTone, setTargetTone] = useState('Warm & Friendly');
  const [targetObjective, setTargetObjective] = useState('Quotation Follow-up');
  const [customerContext, setCustomerContext] = useState(
    'Customer: Harish Nair (Aditya Birla Capital). Received quote VC-QT-2026-0002 for 80 Diwali Hampers 2 days ago. Waiting for sample review.'
  );
  const [generatedMessage, setGeneratedMessage] = useState<any>(null);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Product Recommender State
  const [needDesc, setNeedDesc] = useState('Festive employee gifts for 50 people under ₹500 each');
  const [recommendResults, setRecommendResults] = useState<any>(null);
  const [recommendLoading, setRecommendLoading] = useState(false);

  // Risk Analysis State
  const [riskData, setRiskData] = useState<any>(null);
  const [riskLoading, setRiskLoading] = useState(false);

  // Handle Co-pilot Natural Language Query
  const handleSendCopilot = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;

    const userMsg = { role: 'user' as const, text: q };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!overrideQuery) setQuery('');
    setCopilotLoading(true);

    // Build CRM Snapshot for Server AI
    const crmSnapshot = {
      summary: {
        totalOrders: orders.length,
        totalSalesValue: orders.reduce((acc, o) => acc + (o.totalValue || 0), 0),
        totalOutstanding: orders.reduce((acc, o) => acc + (o.balanceAmount || 0), 0),
        totalLeads: leads.length,
        newLeadsCount: leads.filter((l) => l.status === 'New').length,
        totalCustomers: customers.length,
        repeatCustomersCount: customers.filter((c) => c.totalOrders > 1).length,
      },
      activeOrders: orders.map((o) => ({
        number: o.orderNumber,
        customer: o.customerName,
        value: o.totalValue,
        balance: o.balanceAmount,
        due: o.requiredDeliveryDate,
        productionStatus: o.productionStatus,
        dispatchStatus: o.dispatchStatus,
      })),
      leads: leads.map((l) => ({
        number: l.leadNumber,
        customer: l.customerName,
        source: l.leadSource,
        budget: l.expectedBudget,
        priority: l.priority,
        status: l.status,
      })),
      productsCatalogueSample: products.map((p) => ({
        name: p.name,
        price: p.sellingPrice,
        cost: p.costPrice,
        margin: Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100),
        stock: p.stockQuantity,
      })),
      followUps: followUps.map((f) => ({
        title: f.title,
        customer: f.customerName,
        date: f.scheduledDate,
        status: f.status,
        priority: f.priority,
      })),
    };

    try {
      const response = await fetch('/api/ai/sales-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, crmSnapshot }),
      });
      const res = await response.json();
      if (res.success && res.answer) {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: res.answer }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'I could not retrieve an answer at this moment. Please check server logs.',
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Error contacting server: ${err.message || 'Network error'}`,
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Handle Follow-up Message Generation
  const handleGenerateFollowUp = async () => {
    setFollowupLoading(true);
    setGeneratedMessage(null);
    try {
      const response = await fetch('/api/ai/follow-up-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: targetChannel,
          tone: targetTone,
          objective: targetObjective,
          context: { customerContext },
        }),
      });
      const res = await response.json();
      if (res.success && res.data) {
        setGeneratedMessage(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowupLoading(false);
    }
  };

  // Handle Product Recommendation
  const handleRecommend = async () => {
    setRecommendLoading(true);
    setRecommendResults(null);
    try {
      const response = await fetch('/api/ai/recommend-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerNeed: needDesc,
          catalogue: products.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            sellingPrice: p.sellingPrice,
            bulkPrice: p.bulkPrice,
            stock: p.stockQuantity,
            customizationAvailable: p.customizationAvailable,
          })),
        }),
      });
      const res = await response.json();
      if (res.success && res.data) {
        setRecommendResults(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecommendLoading(false);
    }
  };

  // Handle Order Bottleneck Risk Analysis
  const handleAnalyzeRisk = async () => {
    setRiskLoading(true);
    try {
      const response = await fetch('/api/ai/delivery-risk-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: orders.map((o) => ({
            orderNumber: o.orderNumber,
            customer: o.customerName,
            due: o.requiredDeliveryDate,
            productionStatus: o.productionStatus,
            dispatchStatus: o.dispatchStatus,
            items: o.items.map((i) => ({ name: i.productName, qty: i.quantity })),
          })),
        }),
      });
      const res = await response.json();
      if (res.success && res.data) {
        setRiskData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRiskLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
            <Sparkles className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Vartu AI Intelligence Suite</h2>
            <p className="text-xs text-stone-500">
              Powered by Google Gemini server-side models for real-time sales intelligence, risk detection & copywriting.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'copilot' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sales Co-pilot
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'followup' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Copywriter
          </button>
          <button
            onClick={() => setActiveTab('recommend')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'recommend' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Gift Curator
          </button>
          <button
            onClick={() => {
              setActiveTab('risk');
              if (!riskData) handleAnalyzeRisk();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'risk' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Risk Analyzer
          </button>
        </div>
      </div>

      {/* Tab 1: Live Sales Co-Pilot */}
      {activeTab === 'copilot' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col h-[650px]">
          {/* Quick Prompts Bar */}
          <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-stone-400 shrink-0 font-medium">Quick Queries:</span>
            <button
              onClick={() => handleSendCopilot('Which products have the highest gross margin?')}
              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-md text-stone-700 whitespace-nowrap"
            >
              Highest margin products?
            </button>
            <button
              onClick={() => handleSendCopilot('How much total balance is currently outstanding across orders?')}
              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-md text-stone-700 whitespace-nowrap"
            >
              Outstanding balances?
            </button>
            <button
              onClick={() => handleSendCopilot('Which orders are nearing their required delivery date this week?')}
              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-md text-stone-700 whitespace-nowrap"
            >
              Orders due this week?
            </button>
            <button
              onClick={() => handleSendCopilot('Which lead source generates the highest revenue and conversions?')}
              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-md text-stone-700 whitespace-nowrap"
            >
              Best acquisition channel?
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-lg bg-amber-700 text-white flex items-center justify-center font-serif text-xs font-bold shrink-0">
                    V
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-xl leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-800 border border-stone-200/80 shadow-2xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {copilotLoading && (
              <div className="flex items-center gap-2 text-xs text-stone-400 italic py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
                Vartu Co-pilot querying live CRM data...
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendCopilot();
              }}
              placeholder="Ask about orders, revenue, repeat customers, curing delays, inventory..."
              className="flex-1 p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 focus:bg-white text-stone-800"
            />
            <button
              onClick={() => handleSendCopilot()}
              disabled={copilotLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask Co-pilot</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: AI Follow-Up Message Copywriter */}
      {activeTab === 'followup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-stone-900">Message Parameters</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 mb-1 font-medium">Channel</label>
                <select
                  value={targetChannel}
                  onChange={(e) => setTargetChannel(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram DM">Instagram DM</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Tone</label>
                <select
                  value={targetTone}
                  onChange={(e) => setTargetTone(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  <option value="Warm & Friendly">Warm & Friendly (Artisan)</option>
                  <option value="Professional & Crisp">Professional & Crisp</option>
                  <option value="Urgent / Festival Closing">Urgent / Slot Closing</option>
                  <option value="Festive & Joyful">Festive & Joyful (Diwali/Rakhi)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-stone-600 mb-1 font-medium">Objective</label>
              <select
                value={targetObjective}
                onChange={(e) => setTargetObjective(e.target.value)}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
              >
                <option value="Quotation Follow-up">Quotation Confirmation Follow-up</option>
                <option value="Advance Payment Reminder">Advance Payment & Slot Locking</option>
                <option value="Customer Feedback">Delivered Order Feedback & Review</option>
                <option value="Repeat Festive Order">Loyal Customer Repeat Purchase</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-600 mb-1 font-medium">Customer Context & Product Details</label>
              <textarea
                rows={4}
                value={customerContext}
                onChange={(e) => setCustomerContext(e.target.value)}
                placeholder="Mention customer name, specific products, quotation number, or days elapsed..."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg leading-relaxed"
              />
            </div>

            <button
              onClick={handleGenerateFollowUp}
              disabled={followupLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {followupLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating Craft Copy...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Tailored Message
                </>
              )}
            </button>
          </div>

          {/* Generated Result Box */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  Generated Copy ({targetChannel})
                </span>
                {generatedMessage && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedMessage.message);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                )}
              </div>

              {generatedMessage ? (
                <div className="mt-3 space-y-3 text-xs">
                  {generatedMessage.subject && (
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 font-semibold text-stone-900">
                      Subject: {generatedMessage.subject}
                    </div>
                  )}

                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl whitespace-pre-wrap leading-relaxed text-stone-800 font-sans text-xs">
                    {generatedMessage.message}
                  </div>

                  {generatedMessage.tip && (
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 italic">
                      💡 Sales Tip: {generatedMessage.tip}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-stone-400">
                  Fill parameters and click "Generate Tailored Message" to view AI draft.
                </div>
              )}
            </div>

            {generatedMessage && (
              <div className="pt-3 border-t border-stone-100 flex justify-end">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(generatedMessage.message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  Share via WhatsApp Web
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Gift Curator & Product Matcher */}
      {activeTab === 'recommend' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={needDesc}
              onChange={(e) => setNeedDesc(e.target.value)}
              placeholder="Describe inquiry (e.g. 30 wedding favors under ₹600 or anniversary ocean resin gift)..."
              className="flex-1 p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700"
            />
            <button
              onClick={handleRecommend}
              disabled={recommendLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              {recommendLoading ? 'Matching Catalogue...' : 'Match Catalog Items'}
            </button>
          </div>

          {recommendResults && (
            <div className="space-y-4 pt-3 border-t border-stone-100 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendResults.recommendations?.map((item: any, i: number) => (
                  <div key={i} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <div className="font-bold text-sm text-stone-900">{item.productName}</div>
                    <div className="text-stone-600 leading-relaxed">{item.reason}</div>
                    {item.customizationIdea && (
                      <div className="text-amber-800 font-medium text-[11px] pt-1">
                        ✨ Personalization Idea: {item.customizationIdea}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {recommendResults.bundleSuggestion && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-950 uppercase text-[10px]">Artisan Bundle Concept:</span>
                  <p className="text-stone-800 mt-0.5">{recommendResults.bundleSuggestion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Delivery Risk Analyzer */}
      {activeTab === 'risk' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-sm text-stone-900">Resin Curing & Delivery Bottleneck Detection</h3>
              <p className="text-xs text-stone-500">
                Evaluates curing turnaround (24-48 hrs), packaging buffers & courier transit against promised client dates.
              </p>
            </div>
            <button
              onClick={handleAnalyzeRisk}
              disabled={riskLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${riskLoading ? 'animate-spin' : ''}`} />
              <span>Re-analyze Orders</span>
            </button>
          </div>

          {riskLoading ? (
            <div className="py-12 text-center text-xs text-stone-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-700 border-t-transparent mx-auto mb-2" />
              Checking active orders against resin curing schedules...
            </div>
          ) : riskData ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-stone-500">Overall Studio Pipeline Health:</span>
                  <div className="font-bold text-sm text-stone-900 mt-0.5">{riskData.overallHealth}</div>
                </div>
                <div className="max-w-md text-stone-600 italic text-[11px] text-right">
                  {riskData.productionAdvice}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 uppercase text-[11px]">Attention Required Orders</h4>
                {riskData.highRiskOrders?.map((risk: any, i: number) => (
                  <div key={i} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-bold text-rose-950">
                      <span>Order: {risk.orderNumber}</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                        Risk: {risk.riskLevel}
                      </span>
                    </div>
                    <div className="text-stone-700">{risk.riskReason}</div>
                    <div className="text-stone-900 font-semibold text-[11px] pt-1">
                      Action Required: {risk.suggestedRemedy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
