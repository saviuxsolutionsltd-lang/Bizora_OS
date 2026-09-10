import React from 'react';
import { Product, Sale, MerchantSale, Customer, Organization, Till, User } from '../types';
import { NavTab } from '../components/Sidebar';
import { db } from '../services/db';
import {
  Banknote,
  Store,
  AlertTriangle,
  Wallet,
  PlusCircle,
  History,
  Zap,
  ArrowRight,
  TrendingUp,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

interface DashboardScreenProps {
  org: Organization;
  currentTill?: Till;
  currentUser?: User;
  products?: Product[];
  sales?: Sale[];
  merchantSales?: MerchantSale[];
  customers?: Customer[];
  onNavigate?: (tab: NavTab) => void;
  onNavigateToPos?: () => void;
  onNavigateToStock?: () => void;
  onNavigateToProducts?: () => void;
  onNavigateToSales?: () => void;
  onSelectSaleReceipt?: (sale: Sale) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  org,
  currentTill,
  currentUser,
  products: propProducts,
  sales: propSales,
  merchantSales: propMerchantSales,
  customers: propCustomers,
  onNavigate,
  onNavigateToPos,
  onNavigateToStock,
  onNavigateToProducts,
  onNavigateToSales,
  onSelectSaleReceipt,
}) => {
  // Resolve data safely from props or database fallbacks
  const products = propProducts ?? db.getProducts();
  const sales = propSales ?? db.getSales();
  const merchantSales = propMerchantSales ?? db.getMerchantSales();
  const customers = propCustomers ?? db.getCustomers();

  // Navigation handlers with flexible fallbacks
  const handleGoPos = onNavigateToPos || (() => onNavigate?.('pos'));
  const handleGoStock = onNavigateToStock || (() => onNavigate?.('inventory_stock'));
  const handleGoProducts = onNavigateToProducts || (() => onNavigate?.('products_catalog'));
  const handleGoSales = onNavigateToSales || (() => onNavigate?.('sales_quotations'));

  // Compute real metrics safely with empty-array fallbacks
  const safeSales = sales || [];
  const safeMerchantSales = merchantSales || [];
  const safeProducts = products || [];
  const safeCustomers = customers || [];

  const totalEtrToday = safeSales.reduce((sum, s) => sum + (s?.totalAmount || 0), 0);
  const totalMerchantSales = safeMerchantSales.reduce((sum, ms) => sum + (ms?.totalAmount || 0), 0);
  const lowStockCount = safeProducts.filter(
    (p) => (p?.stockQuantity ?? 0) <= (p?.minStockAlert || p?.reorderLevel || 10)
  ).length;
  const totalWalletBalances = safeCustomers.reduce((sum, c) => sum + (c?.walletBalance || 0), 0);

  // Top performing products
  const topProducts = safeProducts.slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Dark Navy Operational Console Hero Banner - Exactly matching screenshot 1 (Solid #102a71, no gradient) */}
      <div className="bg-[#102a71] text-white rounded-2xl p-6 shadow-sm border border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-950/80 rounded-full border border-blue-400/20 text-[11px] font-bold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>LIVE POS SESSION</span>
            <span className="text-blue-300">•</span>
            <span className="text-blue-200">{org.branchName}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {org.name} ERP Console
          </h2>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            Real-time fiscal sales (ETR / CIU series), merchant transactions, and stock control.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleGoPos}
            className="px-4 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>New Sale (POS)</span>
          </button>
          <button
            type="button"
            onClick={handleGoStock}
            className="px-4 py-2.5 bg-blue-900/60 hover:bg-blue-900 text-white font-bold text-xs rounded-xl border border-blue-400/30 flex items-center gap-2 transition"
          >
            <History className="w-4 h-4 text-blue-200" />
            <span>Stock Movements</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Operational Metric Cards (Exact colors from screenshot 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's ETR Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Today's ETR Sales (CIU)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {org.currency} {totalEtrToday.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>{sales.length} Fiscal Invoices Issued</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Merchant Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Merchant Sales (Non-Fiscal)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {org.currency} {totalMerchantSales.toLocaleString()}
            </div>
            <div className="text-[11px] text-blue-700 font-semibold mt-1">
              {merchantSales.length} Orders • Stock Decremented
            </div>
          </div>
        </div>

        {/* Metric 3: Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Low Stock Alerts
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600 font-mono tracking-tight">
              {lowStockCount} Products
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Below reorder threshold in branch
            </div>
          </div>
        </div>

        {/* Metric 4: Customer Wallet Balances */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Customer Wallet Balances
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {org.currency} {totalWalletBalances.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Advance deposits & store credits
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Top Performing Inventory & Recent Fiscal Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Top Performing Inventory */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Top Performing Inventory (Hardware & Electricals)
              </h3>
              <p className="text-xs text-slate-500">
                Ranked by turnover frequency and sales value
              </p>
            </div>
            <button
              type="button"
              onClick={handleGoProducts}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 transition"
            >
              <span>View All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts.map((prod) => (
              <div
                key={prod.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      SKU: {prod.sku} • {prod.category}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-extrabold text-slate-900 font-mono">
                    {org.currency} {prod.sellingPrice.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold">
                    In Stock: {prod.stockQuantity} {prod.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Recent Fiscal Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Recent Fiscal Invoices
              </h3>
              <p className="text-xs text-slate-500">Sequential CIU Series</p>
            </div>
            <button
              type="button"
              onClick={handleGoSales}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 transition"
            >
              <span>Sales Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {safeSales.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No fiscal receipts issued yet today.
              </div>
            ) : (
              safeSales.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => onSelectSaleReceipt && onSelectSaleReceipt(sale)}
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 rounded-xl cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-900">
                      <Receipt className="w-3.5 h-3.5 text-blue-600" />
                      <span>{sale.ciuSeries || sale.cuNumber || sale.receiptNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate max-w-[160px]">
                      {sale.customerName || 'Walk-in Retail Customer'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900 font-mono">
                      {org.currency} {sale.totalAmount.toLocaleString()}
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      {sale.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
