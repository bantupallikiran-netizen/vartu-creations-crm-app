import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { Product, ProductCosting } from '../types.ts';
import {
  calculateGrossMarginPercent,
  calculateProductCost,
  formatCurrency,
} from '../utils/calculations.ts';
import {
  Search,
  Package,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Clock,
  Boxes,
  Sparkles,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: 'Resin Products',
    subcategory: '',
    description: '',
    imageUrl: '',
    sellingPrice: 499,
    costing: { rawMaterial: 150, labour: 80, packaging: 20, other: 10 },
    moq: 1,
    bulkPrice: 399,
    bulkMoq: 20,
    wholesalePrice: 349,
    wholesaleMoq: 50,
    corporatePrice: 320,
    stockQuantity: 25,
    minStockLevel: 10,
    productionTimeDays: 2,
    customizationAvailable: true,
    customizationCharge: 50,
    active: true,
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `VC-PRD-${String(products.length + 1).padStart(3, '0')}`,
      category: 'Resin Products',
      subcategory: '',
      description: '',
      imageUrl: '',
      sellingPrice: 499,
      costing: { rawMaterial: 150, labour: 80, packaging: 20, other: 10 },
      moq: 1,
      bulkPrice: 399,
      bulkMoq: 20,
      wholesalePrice: 349,
      wholesaleMoq: 50,
      corporatePrice: 320,
      stockQuantity: 25,
      minStockLevel: 10,
      productionTimeDays: 2,
      customizationAvailable: true,
      customizationCharge: 50,
      active: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData(p);
    setShowAddModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sellingPrice) {
      alert('Please fill in product name and selling price');
      return;
    }

    const totalCost = calculateProductCost(
      formData.costing || { rawMaterial: 0, labour: 0, packaging: 0, other: 0 }
    );

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData,
        costPrice: totalCost,
      });
    } else {
      addProduct({
        sku: formData.sku || `SKU-${Date.now()}`,
        name: formData.name,
        category: formData.category || 'Resin Products',
        subcategory: formData.subcategory,
        description: formData.description || '',
        imageUrl: formData.imageUrl || '',
        sellingPrice: Number(formData.sellingPrice),
        costPrice: totalCost,
        costing: formData.costing || { rawMaterial: 0, labour: 0, packaging: 0, other: 0 },
        moq: Number(formData.moq) || 1,
        bulkPrice: Number(formData.bulkPrice) || Number(formData.sellingPrice),
        bulkMoq: Number(formData.bulkMoq) || 20,
        wholesalePrice: Number(formData.wholesalePrice) || Number(formData.sellingPrice),
        wholesaleMoq: Number(formData.wholesaleMoq) || 50,
        corporatePrice: Number(formData.corporatePrice) || undefined,
        stockQuantity: Number(formData.stockQuantity) || 0,
        minStockLevel: Number(formData.minStockLevel) || 5,
        productionTimeDays: Number(formData.productionTimeDays) || 2,
        customizationAvailable: Boolean(formData.customizationAvailable),
        customizationCharge: Number(formData.customizationCharge) || 0,
        active: Boolean(formData.active),
      });
    }

    setShowAddModal(false);
  };

  // Live modal costing
  const formCostingTotal = calculateProductCost(
    formData.costing || { rawMaterial: 0, labour: 0, packaging: 0, other: 0 }
  );
  const formGrossProfit = (Number(formData.sellingPrice) || 0) - formCostingTotal;
  const formGrossMargin = calculateGrossMarginPercent(Number(formData.sellingPrice) || 0, formCostingTotal);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">Product Catalogue, Pricing & Costing</h2>
          <p className="text-xs text-stone-500">
            {products.length} artisanal products configured with retail, bulk, wholesale pricing & margin breakdown.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Product</span>
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
            placeholder="Search products by SKU, title or material..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 focus:bg-white text-stone-800"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none"
        >
          <option value="all">All Categories ({products.length})</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const totalCost = calculateProductCost(p.costing);
          const grossProfit = p.sellingPrice - totalCost;
          const grossMarginPct = calculateGrossMarginPercent(p.sellingPrice, totalCost);
          const isLowStock = p.stockQuantity <= p.minStockLevel;

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header & Category */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                      {p.category} {p.subcategory ? `· ${p.subcategory}` : ''}
                    </span>
                    <h3 className="font-semibold text-sm text-stone-900 mt-0.5 line-clamp-1">{p.name}</h3>
                  </div>
                  <span className="font-mono text-[11px] text-stone-400 shrink-0">{p.sku}</span>
                </div>

                <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">{p.description}</p>

                {/* Tiered Pricing Levels */}
                <div className="mt-3 p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Retail Price:</span>
                    <strong className="font-mono text-stone-900">{formatCurrency(p.sellingPrice)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500">Bulk (MOQ {p.bulkMoq}+):</span>
                    <span className="font-mono text-stone-700">{formatCurrency(p.bulkPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500">Wholesale (MOQ {p.wholesaleMoq}+):</span>
                    <span className="font-mono text-stone-700">{formatCurrency(p.wholesalePrice)}</span>
                  </div>
                </div>

                {/* Costing & Gross Margin Analysis */}
                <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-[10px] text-stone-400">Total Cost</div>
                    <div className="font-mono text-xs font-semibold text-stone-700 mt-0.5">
                      {formatCurrency(totalCost)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400">Gross Profit</div>
                    <div className="font-mono text-xs font-semibold text-emerald-700 mt-0.5">
                      +{formatCurrency(grossProfit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400">Margin %</div>
                    <div className="font-mono text-xs font-bold text-amber-800 mt-0.5">{grossMarginPct}%</div>
                  </div>
                </div>

                {/* Stock & Production Metadata */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                  <span className={isLowStock ? 'text-rose-600 font-semibold' : ''}>
                    Stock: {p.stockQuantity} pcs {isLowStock ? '· Low Stock' : ''}
                  </span>
                  <span>Curing/Time: {p.productionTimeDays} days</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  {p.customizationAvailable ? '✓ Customization available' : 'Standard'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                    title="Edit Product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete product ${p.name}?`)) deleteProduct(p.id);
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingProduct ? 'Edit Product' : 'Add New Artisan Product'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Resin Geode Coasters (Set of 4)"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. RES-CST-001"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                  >
                    <option value="Resin Products">Resin Products</option>
                    <option value="Candles">Candles</option>
                    <option value="Concrete">Concrete</option>
                    <option value="Rakhis">Rakhis</option>
                    <option value="Crochet">Crochet</option>
                    <option value="MDF Frames">MDF Frames</option>
                    <option value="Idols">Idols</option>
                    <option value="Bangles">Bangles</option>
                    <option value="Gift Hampers">Gift Hampers</option>
                    <option value="Other Handmade">Other Handmade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={formData.subcategory || ''}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g. Coasters, Bookmarks, Trays"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Artisan material composition, size, care instructions..."
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                />
              </div>

              {/* Pricing Grid */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <span className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">
                  Tiered Pricing Levels (₹)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-500 text-[11px] mb-1">Retail Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formData.sellingPrice || ''}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 text-[11px] mb-1">Bulk Price (MOQ 20+) (₹)</label>
                    <input
                      type="number"
                      value={formData.bulkPrice || ''}
                      onChange={(e) => setFormData({ ...formData, bulkPrice: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 text-[11px] mb-1">Wholesale Price (50+) (₹)</label>
                    <input
                      type="number"
                      value={formData.wholesalePrice || ''}
                      onChange={(e) => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Costing Calculation Section */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">
                    Costing Breakdown (₹)
                  </span>
                  <span className="text-[11px] font-semibold text-amber-800">
                    Gross Margin: {formGrossMargin}% (Profit: ₹{formGrossProfit})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-stone-500 text-[10px] mb-1">Raw Material</label>
                    <input
                      type="number"
                      value={formData.costing?.rawMaterial || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          costing: { ...formData.costing!, rawMaterial: Number(e.target.value) },
                        })
                      }
                      className="w-full p-1.5 bg-white border border-stone-200 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 text-[10px] mb-1">Labour</label>
                    <input
                      type="number"
                      value={formData.costing?.labour || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          costing: { ...formData.costing!, labour: Number(e.target.value) },
                        })
                      }
                      className="w-full p-1.5 bg-white border border-stone-200 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 text-[10px] mb-1">Packaging</label>
                    <input
                      type="number"
                      value={formData.costing?.packaging || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          costing: { ...formData.costing!, packaging: Number(e.target.value) },
                        })
                      }
                      className="w-full p-1.5 bg-white border border-stone-200 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 text-[10px] mb-1">Other Costs</label>
                    <input
                      type="number"
                      value={formData.costing?.other || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          costing: { ...formData.costing!, other: Number(e.target.value) },
                        })
                      }
                      className="w-full p-1.5 bg-white border border-stone-200 rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Stock and Time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Current Stock Qty</label>
                  <input
                    type="number"
                    value={formData.stockQuantity || 0}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    value={formData.minStockLevel || 5}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Production Time (Days)</label>
                  <input
                    type="number"
                    value={formData.productionTimeDays || 2}
                    onChange={(e) => setFormData({ ...formData, productionTimeDays: Number(e.target.value) })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
