import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { FollowUp, Priority } from '../types.ts';
import { CalendarClock, Plus, Search, CheckCircle2, Clock, MessageSquare, AlertCircle, Phone, X } from 'lucide-react';

export const FollowUpsView: React.FC = () => {
  const { followUps, completeFollowUp, addFollowUp } = useCrm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Follow Up State
  const [newTitle, setNewTitle] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<Priority>('High');
  const [newNotes, setNewNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const overdueList = followUps.filter((f) => f.status === 'Pending' && f.scheduledDate < today);
  const todayList = followUps.filter((f) => f.status === 'Pending' && f.scheduledDate === today);
  const upcomingList = followUps.filter((f) => f.status === 'Pending' && f.scheduledDate > today);
  const completedList = followUps.filter((f) => f.status === 'Completed');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCustName) return;
    addFollowUp({
      entityType: 'Lead',
      entityId: `flw-${Date.now()}`,
      customerName: newCustName,
      contactNumber: newContact,
      scheduledDate: newDate,
      title: newTitle,
      priority: newPriority,
      status: 'Pending',
      notes: newNotes,
    });
    setShowAddModal(false);
    setNewTitle('');
    setNewCustName('');
  };

  const renderFollowUpCard = (f: FollowUp, isOverdue = false) => {
    const cleanPhone = f.contactNumber.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Namaste ${f.customerName}! Following up from Vartu Creations regarding your order.`
    )}`;

    return (
      <div
        key={f.id}
        className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                {f.entityType} Follow-up
              </span>
              <h4 className="font-semibold text-xs text-stone-900 mt-0.5">{f.title}</h4>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                isOverdue
                  ? 'bg-rose-100 text-rose-800'
                  : f.priority === 'High'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {f.priority}
            </span>
          </div>

          <div className="mt-2 text-xs text-stone-700 font-medium">{f.customerName}</div>
          <div className="text-[11px] font-mono text-stone-500">{f.contactNumber}</div>

          {f.notes && (
            <p className="text-[11px] text-stone-500 mt-2 bg-stone-50 p-2 rounded-lg italic border border-stone-100">
              {f.notes}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 font-mono">
            <span>Scheduled: {f.scheduledDate}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
              title="WhatsApp Message"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
            <a
              href={`tel:${f.contactNumber}`}
              className="p-1.5 text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
              title="Call Customer"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {f.status === 'Pending' ? (
            <button
              onClick={() => completeFollowUp(f.id)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-md transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Done</span>
            </button>
          ) : (
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Follow-up Task Engine</h2>
          <p className="text-xs text-stone-500">
            Never miss a quotation confirmation, pending advance payment, customer feedback, or festive repeat purchase.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Schedule Follow-up</span>
        </button>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
              <span>🔴 Overdue Tasks</span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-900 mt-1">{overdueList.length}</div>
          </div>
          <Clock className="w-5 h-5 text-rose-400" />
        </div>

        <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <span>🟡 Due Today</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 mt-1">{todayList.length}</div>
          </div>
          <CalendarClock className="w-5 h-5 text-amber-500" />
        </div>

        <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <span>🟢 Upcoming Pipeline</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-900 mt-1">{upcomingList.length}</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
      </div>

      {/* Overdue Section */}
      {overdueList.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-xs text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Overdue Follow-ups ({overdueList.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueList.map((f) => renderFollowUpCard(f, true))}
          </div>
        </div>
      )}

      {/* Today Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4 text-amber-600" />
          Scheduled for Today ({todayList.length})
        </h3>
        {todayList.length === 0 ? (
          <div className="p-4 bg-white rounded-xl border border-stone-200 text-xs text-stone-500 text-center">
            No follow-ups due today. You are caught up!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayList.map((f) => renderFollowUpCard(f))}
          </div>
        )}
      </div>

      {/* Upcoming Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-600" />
          Upcoming Follow-ups ({upcomingList.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingList.map((f) => renderFollowUpCard(f))}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">Schedule New Follow-up</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Call client for custom resin Rakhi approval"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="e.g. Harish Nair"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Notes & Objective</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes from previous chat, sample sent, agreed budget..."
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
