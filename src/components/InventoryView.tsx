import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { InventoryItem } from '../types.ts';
import { formatCurrency } from '../utils/calculations.ts';
import { Boxes, Plus, Search, AlertTriangle, CheckCircle2, ArrowUpDown, X } from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { inventory, updateInventoryStock, addInventoryItem } = useCrm();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Raw Material' | 'Finished Product'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);

  // New Item State
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    sku: '',
    type: 'Raw Material',
    category: 'Resin & Chemicals',
    unit: 'kg',
    currentStock: 10,
    minStockLevel: 5,
    reorderLevel: 8,
    unitCost: 200,
    supplier: '',
  });

  const filtered = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) return { label: 'Out of Stock', color: 'bg-rose-100 text-rose-800' };
    if (item.currentStock <= item.minStockLevel / 2) return { label: 'Critical', color: 'bg-orange-100 text-orange-800' };
    if (item.currentStock <= item.minStockLevel) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-800' };
    return { label: 'Healthy', color: 'bg-emerald-100 text-emerald-800' };
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    addInventoryItem({
      sku: newItem.sku || `INV-${Date.now()}`,
      name: newItem.name,
      type: newItem.type || 'Raw Material',
      category: newItem.category || 'General',
      unit: newItem.unit || 'pcs',
      currentStock: Number(newItem.currentStock) || 0,
      minStockLevel: Number(newItem.minStockLevel) || 5,
      reorderLevel: Number(newItem.reorderLevel) || 10,
      unitCost: Number(newItem.unitCost) || 0,
      supplier: newItem.supplier || '',
      lastRestocked: new Date().toISOString().split('T')[0],
    });
    setShowAddModal(false);
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    const updated = Math.max(0, adjustingItem.currentStock + adjustQty);
    updateInventoryStock(adjustingItem.id, updated);
    setAdjustingItem(null);
    setAdjustQty(0);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Studio Inventory & Raw Materials</h2>
          <p className="text-xs text-stone-500">
            Track resins, pigments, silicone molds, soy wax flakes, wicks, MDF boards, packaging & stock alerts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Inventory Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search raw materials, suppliers, packaging boxes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 text-stone-800"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setTypeFilter('Raw Material')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'Raw Material' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Raw Materials
          </button>
          <button
            onClick={() => setTypeFilter('Finished Product')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'Finished Product'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Finished Goods
          </button>
        </div>
      </div>

      {/* Inventory Grid Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Type & Category</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Min / Reorder</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4">Supplier & Restock</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((item) => {
                const status = getStockStatus(item);

                return (
                  <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{item.name}</div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">{item.sku}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-stone-800 font-medium">{item.category}</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">{item.type}</div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-stone-900 text-sm">
                      {item.currentStock} <span className="text-[11px] font-normal text-stone-500">{item.unit}</span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-[11px] text-stone-600">
                      Min: {item.minStockLevel} · Reorder: {item.reorderLevel}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-stone-800">
                      {formatCurrency(item.unitCost)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${status.color}`}>
                        {status.label}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-stone-700">{item.supplier || 'Local Crafts Market'}</div>
                      {item.lastRestocked && (
                        <div className="text-[10px] text-stone-400 mt-0.5">Restocked: {item.lastRestocked}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setAdjustingItem(item);
                          setAdjustQty(0);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors whitespace-nowrap"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-500">
                    No inventory records match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">Adjust Stock: {adjustingItem.name}</h3>
              <button onClick={() => setAdjustingItem(null)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div className="text-stone-500">Current In-Stock:</div>
                <div className="font-mono text-xl font-bold text-stone-900 mt-1">
                  {adjustingItem.currentStock} {adjustingItem.unit}
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">
                  Quantity Change (+ for Stock In / Delivery, - for Consumed / Damaged)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustQty((prev) => prev - 1)}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold text-stone-700"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-center font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustQty((prev) => prev + 1)}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold text-stone-700"
                  >
                    +1
                  </button>
                </div>
                <div className="text-[11px] text-stone-400 mt-1.5 text-center">
                  New Stock will be:{' '}
                  <strong className="text-stone-900 font-mono">
                    {Math.max(0, adjustingItem.currentStock + adjustQty)} {adjustingItem.unit}
                  </strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Inventory Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-stone-900">Add Inventory Material</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Fine Glass Sand / Mica Gold Pigment"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Type</label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="Raw Material">Raw Material</option>
                    <option value="Finished Product">Finished Product</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={newItem.category || ''}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    placeholder="e.g. Resin & Chemicals"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-600 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={newItem.currentStock || 0}
                    onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newItem.unit || 'kg'}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="kg, pcs, litres"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={newItem.unitCost || 0}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Min Level</label>
                  <input
                    type="number"
                    value={newItem.minStockLevel || 5}
                    onChange={(e) => setNewItem({ ...newItem, minStockLevel: Number(e.target.value) })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={newItem.supplier || ''}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    placeholder="e.g. ChemCraft Mumbai"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
