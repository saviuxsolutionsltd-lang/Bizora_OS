import React, { useState } from 'react';
import { Product, Organization, User, ProductCompositionItem } from '../types';
import { db } from '../services/db';
import {
  Package,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Download,
  AlertTriangle,
  Tag,
  ShieldAlert,
  CheckSquare,
  Square,
  Layers,
  Eye,
  Sliders,
  CheckCircle2,
  Droplets,
  Wrench,
  Boxes,
  X,
  Printer,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MakerCheckerModal } from '../components/MakerCheckerModal';

interface InventoryScreenProps {
  products: Product[];
  org: Organization;
  currentUser: User;
  users: User[];
  currentTillId?: string;
  onReloadProducts: () => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  org,
  currentUser,
  users,
  onReloadProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('0');
  const [adjustReason, setAdjustReason] = useState('Physical Stock Audit Count');

  // Maker-Checker Modal State
  const [makerCheckerOpen, setMakerCheckerOpen] = useState(false);
  const [directOp, setDirectOp] = useState<{
    operation: any;
    title: string;
    description: string;
    details: string;
    onApproved: () => void;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Paints & Coatings',
    costPrice: 0,
    wholesalePrice: 0,
    sellingPrice: 0,
    stockQuantity: 10,
    minStockAlert: 5,
    unit: 'Tin (20L)',
    description: '',
    isComposition: false,
    isPaintBase: false,
    composition: [] as ProductCompositionItem[],
  });

  const departments = [
    'ALL',
    'Paints & Coatings',
    'Electricals & Cables',
    'Plumbing & Pipes',
    'Fasteners & Hardware',
    'Power Tools',
    'Masonry & Cement',
    'Raw Paint Bases',
  ];

  // Raw base products available for composition
  const baseProducts = products.filter((p) => p.isPaintBase || p.category.toLowerCase().includes('base'));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));

    const matchesDept =
      departmentFilter === 'ALL' ||
      (departmentFilter === 'Raw Paint Bases' ? p.isPaintBase : p.category === departmentFilter);

    const matchesStock =
      stockStatusFilter === 'ALL' ||
      (stockStatusFilter === 'OUT_OF_STOCK' && p.stockQuantity <= 0) ||
      (stockStatusFilter === 'LOW_STOCK' && p.stockQuantity > 0 && p.stockQuantity <= (p.minStockAlert || 5)) ||
      (stockStatusFilter === 'IN_STOCK' && p.stockQuantity > (p.minStockAlert || 5));

    return matchesSearch && matchesDept && matchesStock;
  });

  // Analytics Metrics
  const totalStockItems = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalStockValuation = products.reduce((acc, p) => acc + p.stockQuantity * (p.costPrice || p.buyingPrice), 0);
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= (p.minStockAlert || 5)).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  // Chart Data: Stock Valuation by Category
  const categoryValMap: { [key: string]: number } = {};
  products.forEach((p) => {
    const cat = p.category || 'Other';
    const val = p.stockQuantity * (p.costPrice || p.buyingPrice || 0);
    categoryValMap[cat] = (categoryValMap[cat] || 0) + val;
  });
  const categoryChartData = Object.keys(categoryValMap).map((cat) => ({
    name: cat.length > 14 ? cat.substring(0, 13) + '...' : cat,
    value: Math.round(categoryValMap[cat]),
  }));

  // Chart Data: Stock Health Breakdown
  const healthData = [
    { name: 'Optimal Stock', value: products.length - lowStockCount - outOfStockCount, color: '#10b981' },
    { name: 'Low Reorder Level', value: lowStockCount, color: '#f59e0b' },
    { name: 'Depleted Stock', value: outOfStockCount, color: '#ef4444' },
  ];

  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Single Product Delete (Maker-Checker Enforced)
  const handleDeleteProduct = (product: Product) => {
    setDirectOp({
      operation: 'DELETE_PRODUCT',
      title: `Delete Product SKU: ${product.sku}`,
      description: `Permanent deletion of catalog item "${product.name}".`,
      details: `Stock on record: ${product.stockQuantity} ${product.unit} | Selling Price: ${org.currency} ${product.sellingPrice}`,
      onApproved: () => {
        db.deleteProduct(product.id);
        onReloadProducts();
      },
    });
    setMakerCheckerOpen(true);
  };

  // Bulk Product Deletion (Maker-Checker Enforced)
  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    setDirectOp({
      operation: 'BULK_DELETE_PRODUCTS',
      title: `Bulk Deletion of ${count} Inventory Products`,
      description: `Supervisor dual-authorization required to purge ${count} products simultaneously.`,
      details: `Target Product IDs: ${selectedProductIds.join(', ')}`,
      onApproved: () => {
        selectedProductIds.forEach((id) => db.deleteProduct(id));
        setSelectedProductIds([]);
        onReloadProducts();
      },
    });
    setMakerCheckerOpen(true);
  };

  // Open Add Product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      barcode: `${Math.floor(616110000000 + Math.random() * 999999)}`,
      category: 'Paints & Coatings',
      costPrice: 0,
      wholesalePrice: 0,
      sellingPrice: 0,
      stockQuantity: 10,
      minStockAlert: 5,
      unit: 'Tin (20L)',
      description: '',
      isComposition: false,
      isPaintBase: false,
      composition: [],
    });
    setIsModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category,
      costPrice: p.costPrice || p.buyingPrice,
      wholesalePrice: p.wholesalePrice || Math.round(p.sellingPrice * 0.9),
      sellingPrice: p.sellingPrice,
      stockQuantity: p.stockQuantity,
      minStockAlert: p.minStockAlert || p.reorderLevel || 5,
      unit: p.unit,
      description: p.description || '',
      isComposition: !!p.isComposition,
      isPaintBase: !!p.isPaintBase,
      composition: p.composition || [],
    });
    setIsModalOpen(true);
  };

  // Add composition base recipe item
  const handleAddCompositionItem = () => {
    const defaultBase = baseProducts[0] || products[0];
    if (!defaultBase) return;
    setFormData((prev) => ({
      ...prev,
      isComposition: true,
      composition: [
        ...prev.composition,
        {
          baseProductId: defaultBase.id,
          baseProductName: defaultBase.name,
          quantityRequired: 1,
          unit: defaultBase.unit || 'Liters',
          percentage: 0,
        },
      ],
    }));
  };

  const handleRemoveCompositionItem = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      composition: prev.composition.filter((_, i) => i !== idx),
    }));
  };

  const handleCompositionBaseChange = (idx: number, baseId: string) => {
    const baseP = products.find((p) => p.id === baseId);
    if (!baseP) return;
    const updated = [...formData.composition];
    updated[idx] = {
      ...updated[idx],
      baseProductId: baseP.id,
      baseProductName: baseP.name,
      unit: baseP.unit || 'Liters',
    };
    setFormData({ ...formData, composition: updated });
  };

  const handleCompositionQtyChange = (idx: number, qty: number) => {
    const updated = [...formData.composition];
    updated[idx] = { ...updated[idx], quantityRequired: Math.max(0.1, qty) };
    setFormData({ ...formData, composition: updated });
  };

  const handleCompositionPctChange = (idx: number, pct: number) => {
    const updated = [...formData.composition];
    updated[idx] = { ...updated[idx], percentage: Math.max(0, Math.min(100, pct)) };
    setFormData({ ...formData, composition: updated });
  };

  // Submit Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const saveAction = () => {
      if (editingProduct) {
        const updated: Product = {
          ...editingProduct,
          name: formData.name,
          sku: formData.sku,
          barcode: formData.barcode,
          category: formData.category,
          costPrice: formData.costPrice,
          buyingPrice: formData.costPrice,
          wholesalePrice: formData.wholesalePrice,
          sellingPrice: formData.sellingPrice,
          stockQuantity: formData.stockQuantity,
          minStockAlert: formData.minStockAlert,
          reorderLevel: formData.minStockAlert,
          unit: formData.unit,
          description: formData.description,
          isComposition: formData.isComposition,
          isPaintBase: formData.isPaintBase,
          composition: formData.isComposition ? formData.composition : [],
          updatedAt: new Date().toISOString(),
        };
        db.updateProduct(updated);
      } else {
        const newP: Product = {
          id: `PRD-${Date.now().toString().slice(-6)}`,
          name: formData.name,
          sku: formData.sku || `SKU-${Date.now().toString().slice(-4)}`,
          barcode: formData.barcode,
          category: formData.category,
          paintBaseIds: formData.composition.map((c) => c.baseProductName),
          costPrice: formData.costPrice,
          buyingPrice: formData.costPrice,
          wholesalePrice: formData.wholesalePrice,
          sellingPrice: formData.sellingPrice,
          stockQuantity: formData.stockQuantity,
          minStockAlert: formData.minStockAlert,
          reorderLevel: formData.minStockAlert,
          unit: formData.unit,
          description: formData.description,
          isComposition: formData.isComposition,
          isPaintBase: formData.isPaintBase,
          composition: formData.isComposition ? formData.composition : [],
          status: 'active',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        db.addProduct(newP);
      }
      setIsModalOpen(false);
      onReloadProducts();
    };

    // Maker-Checker PIN for significant price alterations
    if (
      editingProduct &&
      (editingProduct.sellingPrice !== formData.sellingPrice || editingProduct.costPrice !== formData.costPrice)
    ) {
      setDirectOp({
        operation: 'PRODUCT_PRICE_CHANGE',
        title: `Authorize Price Change: ${formData.name}`,
        description: `Old Selling: ${org.currency} ${editingProduct.sellingPrice} → New: ${org.currency} ${formData.sellingPrice}`,
        details: `Cost: ${editingProduct.costPrice || editingProduct.buyingPrice} → ${formData.costPrice} | SKU: ${editingProduct.sku}`,
        onApproved: saveAction,
      });
      setMakerCheckerOpen(true);
      return;
    }

    saveAction();
  };

  // Handle Quick Stock Adjust
  const handleSaveStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const delta = parseFloat(adjustDelta);
    if (isNaN(delta) || delta === 0) return;

    db.adjustStockQuantity(
      adjustingProduct.id,
      delta,
      adjustReason,
      currentUser.staffId,
      `Adjusted via Inventory Quick Console by ${currentUser.firstName}`
    );
    setAdjustingProduct(null);
    setAdjustDelta('0');
    onReloadProducts();
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['SKU', 'Name', 'Barcode', 'Category', 'IsComposition', 'Cost Price', 'Wholesale', 'Retail Price', 'Stock', 'Unit'];
    const rows = filteredProducts.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.barcode,
      p.category,
      p.isComposition ? 'Yes' : 'No',
      p.costPrice || p.buyingPrice,
      p.wholesalePrice || p.sellingPrice,
      p.sellingPrice,
      p.stockQuantity,
      p.unit,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bizora_hardware_inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-700">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Inventory & Paint Formulation Catalog
              </h1>
              <p className="text-xs text-slate-500">
                Multi-base paint formulations, electrical specifications, stock balances & automated recipe dispenses
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedProductIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedProductIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#132252] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Stock Units</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalStockItems.toLocaleString()}</div>
          <p className="mt-1 text-[11px] text-slate-400">Across {products.length} distinct catalog SKUs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Warehouse Valuation</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {org.currency} {Math.round(totalStockValuation).toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">At weighted average landed cost</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Low Stock Reorders</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{lowStockCount}</div>
          <p className="mt-1 text-[11px] text-amber-600 font-medium">SKUs near threshold minimum</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Paint Formulations</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Droplets className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-700">
            {products.filter((p) => p.isComposition).length}
          </div>
          <p className="mt-1 text-[11px] text-purple-600 font-medium">Composite paint products linked to bases</p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inventory Valuation by Department (KES)</h3>
              <p className="text-xs text-slate-500">Capital tied up in distinct physical storage sections</p>
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`${org.currency} ${Number(val).toLocaleString()}`, 'Valuation']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#fff' }}
                />
                <Bar dataKey="value" fill="#132252" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Stock Health Status</h3>
            <p className="text-xs text-slate-500">Catalog supply safety ratios</p>
          </div>
          <div className="h-44 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={healthData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value">
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} SKUs`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            {healthData.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-slate-500">{item.name}</span>
                <span className="text-xs font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU, Barcode, Product Name, Base formulation..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#132252]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#132252]"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#132252]"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">Optimal In-Stock</option>
            <option value="LOW_STOCK">Low Stock Reorders</option>
            <option value="OUT_OF_STOCK">Depleted / Zero Stock</option>
          </select>
        </div>
      </div>

      {/* Main Datatable */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button type="button" onClick={handleSelectAll} className="text-slate-500 hover:text-slate-900">
                    {selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Barcode</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Composition / Base</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Wholesale</th>
                <th className="py-3 px-4 text-right">Retail Price</th>
                <th className="py-3 px-4 text-center">In Stock</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No products match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isSelected = selectedProductIds.includes(prod.id);
                  const isLow = prod.stockQuantity > 0 && prod.stockQuantity <= (prod.minStockAlert || 5);
                  const isOut = prod.stockQuantity <= 0;

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-slate-50/70 transition ${isSelected ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(prod.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{prod.name}</span>
                          {prod.isComposition && (
                            <span className="p-0.5 rounded bg-purple-100 text-purple-800" title="Composite Product">
                              <Droplets className="w-3 h-3" />
                            </span>
                          )}
                          {prod.isPaintBase && (
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-mono">
                              RAW BASE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{prod.sku}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{prod.barcode}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{prod.category}</div>
                        <div className="text-[10px] text-slate-400">{prod.unit}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {prod.isComposition && prod.composition && prod.composition.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700">
                              <Droplets className="w-3 h-3" />
                              {prod.composition.length} Base Constituents
                            </span>
                            <span className="text-[9px] text-slate-400 truncate max-w-[140px]">
                              {prod.composition.map((c) => c.baseProductName.replace(/Crown Master Tint /g, '')).join(', ')}
                            </span>
                          </div>
                        ) : prod.isPaintBase ? (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-300 bg-slate-100 text-slate-700">
                            Raw Dispense Base
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Standard SKU</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-right">
                        {org.currency} {(prod.costPrice || prod.buyingPrice).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-right">
                        {org.currency} {(prod.wholesalePrice || Math.round(prod.sellingPrice * 0.9)).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                        {org.currency} {prod.sellingPrice.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {prod.stockQuantity} {prod.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* VIEW DETAILS */}
                          <button
                            type="button"
                            onClick={() => setViewingProduct(prod)}
                            title="View Product Dossier & Formulation"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* QUICK STOCK ADJUST */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingProduct(prod);
                              setAdjustDelta('0');
                            }}
                            title="Quick Stock Adjustment / Audit Count"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* EDIT */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            title="Edit Product & Formulation Recipe"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod)}
                            title="Delete Product (Maker-Checker Enforced)"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW DETAILS & FORMULATION DOSSIER */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Product Dossier</span>
                <h3 className="text-base font-bold text-slate-900">{viewingProduct.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">SKU / Code:</span>
                <span className="font-mono font-bold text-slate-800">{viewingProduct.sku}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Barcode:</span>
                <span className="font-mono text-slate-800">{viewingProduct.barcode}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Category:</span>
                <span className="font-bold text-slate-800">{viewingProduct.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Current Physical Stock:</span>
                <span className="font-bold text-emerald-700">{viewingProduct.stockQuantity} {viewingProduct.unit}</span>
              </div>
            </div>

            {/* If Composite Paint Product: Show Constituent Base Formulations */}
            {viewingProduct.isComposition && viewingProduct.composition && viewingProduct.composition.length > 0 ? (
              <div className="space-y-2 border border-purple-200 bg-purple-50/50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <Droplets className="w-4 h-4 text-purple-600" />
                  <span>Constituent Paint Formulation Recipe</span>
                </div>
                <p className="text-[11px] text-purple-700">
                  When sold at POS, the system automatically dispenses and deducts the following individual base quantities from inventory:
                </p>

                <div className="bg-white rounded-lg border border-purple-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-purple-100/70 text-purple-900 font-bold text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Base Product Name</th>
                        <th className="py-2 px-3 text-center">Req / Unit</th>
                        <th className="py-2 px-3 text-center">Ratio (%)</th>
                        <th className="py-2 px-3 text-right">Base Live Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 text-slate-700">
                      {viewingProduct.composition.map((c, i) => {
                        const baseProd = products.find((p) => p.id === c.baseProductId);
                        return (
                          <tr key={i}>
                            <td className="py-2 px-3 font-medium">{c.baseProductName}</td>
                            <td className="py-2 px-3 text-center font-bold">
                              {c.quantityRequired} {c.unit}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-purple-700">{c.percentage}%</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                              {baseProd ? `${baseProd.stockQuantity} ${baseProd.unit}` : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : viewingProduct.isPaintBase ? (
              <div className="bg-slate-100 p-3 rounded-xl text-xs text-slate-700">
                <strong>Raw Paint Base Material:</strong> This product serves as an input raw material. In real-world operations, it is selected individually when receiving procurement purchases from suppliers or mixing custom blends.
              </div>
            ) : null}

            {/* Pricing Summary */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-3 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 block">Landed Cost</span>
                <span className="font-bold text-slate-800 font-mono">
                  {org.currency} {(viewingProduct.costPrice || viewingProduct.buyingPrice).toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 block">Wholesale Rate</span>
                <span className="font-bold text-slate-800 font-mono">
                  {org.currency} {(viewingProduct.wholesalePrice || Math.round(viewingProduct.sellingPrice * 0.9)).toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-900 text-white p-2.5 rounded-lg">
                <span className="text-slate-400 block">Retail Price</span>
                <span className="font-black text-amber-400 font-mono">
                  {org.currency} {viewingProduct.sellingPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK STOCK ADJUSTMENT */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Stock Adjustment</h3>
                <p className="text-xs text-slate-500">{adjustingProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjust} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl flex justify-between">
                <span className="text-slate-500 font-medium">Current Stock on Record:</span>
                <span className="font-bold text-slate-900">
                  {adjustingProduct.stockQuantity} {adjustingProduct.unit}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Delta (+/- units)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  placeholder="e.g., +15 or -3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  New resulting stock:{' '}
                  <strong>
                    {Math.max(0, adjustingProduct.stockQuantity + (parseFloat(adjustDelta) || 0))}{' '}
                    {adjustingProduct.unit}
                  </strong>
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Justification</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Physical Stock Audit Count">Physical Stock Audit Count</option>
                  <option value="Damaged / Leaked Cans Write-Off">Damaged / Leaked Cans Write-Off</option>
                  <option value="Supplier Over-delivery Bonus">Supplier Over-delivery Bonus</option>
                  <option value="Stock Re-classification">Stock Re-classification</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE / EDIT PRODUCT WITH MULTI-BASE COMPOSITION BUILDER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-[#132252] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-wide text-white">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Hardware & Paint Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-white/10 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Crown Permaplast Exterior Emulsion 20L"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#132252]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department / Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  >
                    {departments.filter((d) => d !== 'ALL' && d !== 'Raw Paint Bases').map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Tin (20L), Pcs, Roll, Liters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price ({org.currency})</label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wholesale ({org.currency})</label>
                  <input
                    type="number"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Retail Rate ({org.currency})</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Reorder Alert</label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* PAINT ATTRIBUTES: COMPOSITION & RAW BASE TOGGLES */}
              <div className="border border-purple-200 bg-purple-50/50 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900">Paint Composition & Base Formulation</span>
                  </div>
                </div>

                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isComposition}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          isComposition: checked,
                          isPaintBase: checked ? false : prev.isPaintBase,
                          composition: checked && prev.composition.length === 0 && baseProducts[0] ? [
                            {
                              baseProductId: baseProducts[0].id,
                              baseProductName: baseProducts[0].name,
                              quantityRequired: 14,
                              unit: 'Liters',
                              percentage: 70,
                            }
                          ] : prev.composition,
                        }));
                      }}
                      className="rounded text-purple-600"
                    />
                    <span className="font-semibold text-slate-800">
                      Composite Paint Product (Formulated from multiple bases)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPaintBase}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          isPaintBase: checked,
                          isComposition: checked ? false : prev.isComposition,
                        }));
                      }}
                      className="rounded text-slate-600"
                    />
                    <span className="font-semibold text-slate-800">
                      Raw Paint Base Material (Procurement only)
                    </span>
                  </label>
                </div>

                {/* Composition Items List */}
                {formData.isComposition && (
                  <div className="space-y-2 pt-2 border-t border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900 uppercase">
                        Constituent Base Ingredients (e.g., Base 1, Base 2, Base 4)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddCompositionItem}
                        className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Link Another Base
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formData.composition.map((comp, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-purple-200">
                          <select
                            value={comp.baseProductId}
                            onChange={(e) => handleCompositionBaseChange(idx, e.target.value)}
                            className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                          >
                            {baseProducts.map((bp) => (
                              <option key={bp.id} value={bp.id}>
                                {bp.name} ({bp.unit}) - In Stock: {bp.stockQuantity}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={comp.quantityRequired}
                              onChange={(e) => handleCompositionQtyChange(idx, parseFloat(e.target.value) || 0)}
                              placeholder="Qty"
                              className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center"
                            />
                            <span className="text-[10px] text-slate-500">{comp.unit}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={comp.percentage}
                              onChange={(e) => handleCompositionPctChange(idx, parseFloat(e.target.value) || 0)}
                              placeholder="%"
                              className="w-12 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center"
                            />
                            <span className="text-[10px] text-slate-500">%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveCompositionItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specifications & Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Pure copper conductor, KEBS certified, formulation recipe details..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#132252]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#132252] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maker-Checker Direct Authorization Modal */}
      {makerCheckerOpen && directOp && (
        <MakerCheckerModal
          isOpen={makerCheckerOpen}
          onClose={() => setMakerCheckerOpen(false)}
          currentUser={currentUser}
          users={users}
          directOperation={directOp}
        />
      )}
    </div>
  );
};
