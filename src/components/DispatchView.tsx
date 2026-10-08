import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { DispatchRecord } from '../types.ts';
import { formatCurrency } from '../utils/calculations.ts';
import { Truck, Plus, Search, CheckCircle2, Clock, MapPin, X } from 'lucide-react';

export const DispatchView: React.FC = () => {
  const { dispatches, updateDispatch, orders } = useCrm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingDispatch, setEditingDispatch] = useState<DispatchRecord | null>(null);

  const filtered = dispatches.filter((d) => {
    const matchesSearch =
      d.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.awbTrackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.courier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const couriers = [
    'Delhivery Surface',
    'Delhivery Express',
    'Blue Dart Air',
    'DTDC Express',
    'India Post Speed Post',
    'Shiprocket',
    'Porter / Local Studio Pickup',
  ];

  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDispatch) return;
    updateDispatch(editingDispatch.id, editingDispatch);
    setEditingDispatch(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Dispatch & Courier Logistics</h2>
          <p className="text-xs text-stone-500">
            Manage parcel packaging, generate AWB tracking references & track shipping milestones with domestic couriers.
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
            placeholder="Search AWB tracking #, order, customer name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 text-stone-800"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none"
        >
          <option value="all">All Dispatch Statuses</option>
          <option value="Ready">Ready to Pack</option>
          <option value="Packed">Packed</option>
          <option value="Dispatched">Dispatched</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      {/* Dispatch Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Order # & Customer</th>
                <th className="py-3 px-4">Shipping Destination</th>
                <th className="py-3 px-4">Courier Partner</th>
                <th className="py-3 px-4">AWB Tracking #</th>
                <th className="py-3 px-4">Dispatch & ETA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-stone-900">{d.orderNumber}</div>
                    <div className="font-medium text-stone-800 text-[11px] mt-0.5">{d.customerName}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{d.customerMobile}</div>
                  </td>

                  <td className="py-3 px-4 max-w-xs truncate text-stone-600">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{d.shippingAddress}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-medium text-stone-800">{d.courier}</span>
                    <div className="text-[10px] text-stone-400 mt-0.5">Charge: {formatCurrency(d.shippingCharge)}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-mono font-semibold text-stone-900 text-[11px]">
                      {d.awbTrackingNumber || 'Pending AWB'}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-stone-600 text-[11px]">
                    <div>Shipped: {d.dispatchDate}</div>
                    <div className="text-stone-400 mt-0.5">ETA: {d.expectedDelivery}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        d.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'In Transit' || d.status === 'Dispatched'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setEditingDispatch(d)}
                      className="px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                    >
                      Update AWB
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-500">
                    No dispatch records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dispatch Modal */}
      {editingDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">
                Update Dispatch: {editingDispatch.orderNumber}
              </h3>
              <button onClick={() => setEditingDispatch(null)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1">Courier Partner</label>
                <select
                  value={editingDispatch.courier}
                  onChange={(e) => setEditingDispatch({ ...editingDispatch, courier: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  {couriers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">AWB Tracking Number</label>
                <input
                  type="text"
                  value={editingDispatch.awbTrackingNumber}
                  onChange={(e) => setEditingDispatch({ ...editingDispatch, awbTrackingNumber: e.target.value })}
                  placeholder="e.g. DEL-9928174412 / BLU-554433"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Dispatch Status</label>
                <select
                  value={editingDispatch.status}
                  onChange={(e) => setEditingDispatch({ ...editingDispatch, status: e.target.value as any })}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  <option value="Ready">Ready to Dispatch</option>
                  <option value="Packed">Packed</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delivery Failed">Delivery Failed</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Expected Delivery (ETA)</label>
                  <input
                    type="date"
                    value={editingDispatch.expectedDelivery}
                    onChange={(e) => setEditingDispatch({ ...editingDispatch, expectedDelivery: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Actual Delivery Date</label>
                  <input
                    type="date"
                    value={editingDispatch.actualDelivery || ''}
                    onChange={(e) => setEditingDispatch({ ...editingDispatch, actualDelivery: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingDispatch(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs"
                >
                  Save Dispatch Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
