import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { ProductionRecord } from '../types.ts';
import { calculateBalanceQty } from '../utils/calculations.ts';
import { Hammer, CheckCircle2, AlertTriangle, Clock, Search, Edit2, X } from 'lucide-react';

export const ProductionView: React.FC = () => {
  const { production, updateProductionRecord, orders } = useCrm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);

  const filtered = production.filter((rec) => {
    const matchesSearch =
      rec.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.controller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const balance = calculateBalanceQty(
      editingRecord.requiredQty,
      editingRecord.producedQty,
      editingRecord.rejectedQty
    );
    updateProductionRecord(editingRecord.id, {
      ...editingRecord,
      balanceQty: balance,
    });
    setEditingRecord(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Studio Production Tracking & Quality Control</h2>
          <p className="text-xs text-stone-500">
            Monitor batch pours, curing schedules, rejection rate, balance quantities & quality check controller assignments.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search production by order #, product name, artisan lead..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 text-stone-800"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none"
        >
          <option value="all">All Production Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="QC Check">QC Check</option>
          <option value="Completed">Completed</option>
          <option value="Delayed">Delayed</option>
        </select>
      </div>

      {/* Production Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Order # & Product</th>
                <th className="py-3 px-4 text-center">Required Qty</th>
                <th className="py-3 px-4 text-center">Produced</th>
                <th className="py-3 px-4 text-center">Rejected</th>
                <th className="py-3 px-4 text-center">Balance Qty</th>
                <th className="py-3 px-4">Timeline (Expected)</th>
                <th className="py-3 px-4">QC Status</th>
                <th className="py-3 px-4">Controller / Artisan</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((rec) => {
                const balance = calculateBalanceQty(rec.requiredQty, rec.producedQty, rec.rejectedQty);

                return (
                  <tr key={rec.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-stone-900">{rec.orderNumber}</div>
                      <div className="font-medium text-stone-800 text-[11px] mt-0.5 max-w-xs truncate">
                        {rec.productName}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">{rec.sku}</div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-stone-900">
                      {rec.requiredQty}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-emerald-700 font-bold">
                      {rec.producedQty}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-rose-600">
                      {rec.rejectedQty}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-900">
                      {balance}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-stone-700">{rec.expectedCompletionDate}</div>
                      {rec.actualCompletionDate && (
                        <div className="text-[10px] text-emerald-700 mt-0.5">Finished: {rec.actualCompletionDate}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                          rec.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800'
                            : rec.status === 'QC Check'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-800">{rec.controller}</div>
                      {rec.remarks && (
                        <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-1 italic">{rec.remarks}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditingRecord(rec)}
                        className="px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                      >
                        Update Qty
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-stone-500">
                    No production records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Production Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">
                Update Production: {editingRecord.orderNumber}
              </h3>
              <button onClick={() => setEditingRecord(null)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="space-y-3 text-xs">
              <div className="text-stone-600 font-medium">{editingRecord.productName}</div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div>
                  <label className="block text-stone-400 text-[10px] mb-1">Required</label>
                  <div className="font-mono font-bold text-stone-900 text-sm">{editingRecord.requiredQty}</div>
                </div>
                <div>
                  <label className="block text-stone-400 text-[10px] mb-1">Produced Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={editingRecord.producedQty}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, producedQty: Number(e.target.value) })
                    }
                    className="w-full p-1 bg-white border border-stone-200 rounded font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 text-[10px] mb-1">Rejected Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={editingRecord.rejectedQty}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, rejectedQty: Number(e.target.value) })
                    }
                    className="w-full p-1 bg-white border border-stone-200 rounded font-mono text-center text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Production Status</label>
                <select
                  value={editingRecord.status}
                  onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value as any })}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress (Pouring / Curing)</option>
                  <option value="QC Check">QC Check (Polishing & Finishing)</option>
                  <option value="Completed">Completed (Passed QC)</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Controller / Lead Artisan</label>
                <input
                  type="text"
                  value={editingRecord.controller}
                  onChange={(e) => setEditingRecord({ ...editingRecord, controller: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Remarks & QC Notes</label>
                <textarea
                  rows={2}
                  value={editingRecord.remarks || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, remarks: e.target.value })}
                  placeholder="e.g. Curing took 36 hours; top coat polished to high gloss."
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
