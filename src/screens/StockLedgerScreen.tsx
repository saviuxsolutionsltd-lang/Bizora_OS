import React, { useState } from 'react';
import { Product, Organization, User } from '../types';
import { db } from '../services/db';
import {
  SlidersHorizontal,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { MakerCheckerModal } from '../components/MakerCheckerModal';

interface StockLedgerScreenProps {
  products: Product[];
  org: Organization;
  currentUser: User;
  users: User[];
  currentTillId: string;
  onStockUpdated: () => void;
}

export const StockLedgerScreen: React.FC<StockLedgerScreenProps> = ({
  products,
  org,
  currentUser,
  users,
  currentTillId,
  onStockUpdated,
}) => {
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [deltaQuantity, setDeltaQuantity] = useState<number>(1);
  const [reasonCode, setReasonCode] = useState('Physical Count Variance');
  const [auditNotes, setAuditNotes] = useState('');

  // Maker-Checker state
  const [makerCheckerModalOpen, setMakerCheckerModalOpen] = useState(false);
  const [pendingAdjustmentData, setPendingAdjustmentData] = useState<{
    product: Product;
    delta: number;
    reason: string;
    notes: string;
  } | null>(null);

  const stockMovements = db.getStockMovements();

  const handleOpenAdjustment = () => {
    setIsAdjustModalOpen(true);
  };

  const handleCommitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    // All stock adjustments (especially write-offs/negative deltas) require Maker-Checker Supervisor Sign-Off
    setPendingAdjustmentData({
      product,
      delta: deltaQuantity,
      reason: reasonCode,
      notes: auditNotes || 'Stock variance recorded via Inventory Ledger',
    });
    setMakerCheckerModalOpen(true);
  };

  const executeAdjustment = () => {
    if (!pendingAdjustmentData) return;
    const { product, delta, reason, notes } = pendingAdjustmentData;

    db.adjustStockQuantity(
      product.id,
      delta,
      reason,
      currentUser.staffId,
      notes,
      `ADJ-${Date.now().toString().slice(-6)}`
    );

    setIsAdjustModalOpen(false);
    setPendingAdjustmentData(null);
    setAuditNotes('');
    setDeltaQuantity(1);
    onStockUpdated();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header - Matching Screenshot 3 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Movement Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Immutable audit record of every stock decrement, restock, transfer, and variance adjustment.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdjustment}
          className="px-4 py-2.5 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition active:scale-95"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Adjust Stock / Log Variance</span>
        </button>
      </div>

      {/* 3 Summary Cards - Exact from Screenshot 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Total Catalog Lines
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {products.length} SKUs
          </div>
          <p className="text-[11px] text-slate-500">
            Active hardware & electrical goods
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Total Ledger Movements
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {stockMovements.length} Events
          </div>
          <p className="text-[11px] text-slate-500">
            Cryptographically logged & sequenced
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Audit Compliance
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">
            100% Invariant
          </div>
          <p className="text-[11px] text-slate-500">
            Zero untracked inventory modifications
          </p>
        </div>
      </div>

      {/* Branch Stock Movements Table - Matching Screenshot 3 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Branch Stock Movements
            </h3>
            <p className="text-[11px] text-slate-500">
              Showing all ledger entries for current branch ({org.branchName})
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Item / SKU</th>
                <th className="py-3 px-4 text-center">Movement Delta</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4">Reason Code / Notes</th>
                <th className="py-3 px-4">Reference Ref</th>
                <th className="py-3 px-4">Cashier / Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No stock movements logged yet.
                  </td>
                </tr>
              ) : (
                stockMovements.map((sm) => (
                  <tr key={sm.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {new Date(sm.createdAt).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sm.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {sm.productId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-mono font-extrabold ${
                          sm.deltaQuantity < 0
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {sm.deltaQuantity > 0 ? `+${sm.deltaQuantity}` : sm.deltaQuantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {sm.type}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                      {sm.notes || sm.reason || 'Standard operation'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-blue-700 font-bold">
                      {sm.referenceId || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      ID: {sm.staffId || currentUser.staffId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment / Variance Log Modal - Exact from Screenshot 4 */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header - Dark Navy #101f42 (No gradient) */}
            <div className="bg-[#101f42] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-wide text-white">
                Stock Adjustment / Variance Log
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCommitAdjustment} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Select Product:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#101f42]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Stock: {p.stockQuantity} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Delta Quantity (use negative for write-off, positive for found stock):
                </label>
                <input
                  type="number"
                  step="any"
                  value={deltaQuantity}
                  onChange={(e) => setDeltaQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-[#101f42]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Reason Code:
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#101f42]"
                >
                  <option value="Physical Count Variance">Physical Count Variance</option>
                  <option value="Damaged in Storage">Damaged in Storage</option>
                  <option value="Expired / Defective Batch">Expired / Defective Batch</option>
                  <option value="Internal Branch Transfer">Internal Branch Transfer</option>
                  <option value="Supplier Replacement">Supplier Replacement</option>
                  <option value="Found During Monthly Stocktake">Found During Monthly Stocktake</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Audit Notes / Explanation:
                </label>
                <textarea
                  rows={3}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="e.g. Broken bucket discovered during monthly stocktake"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#101f42]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maker-Checker Verification Modal for Stock Variance */}
      {makerCheckerModalOpen && pendingAdjustmentData && (
        <MakerCheckerModal
          isOpen={makerCheckerModalOpen}
          onClose={() => setMakerCheckerModalOpen(false)}
          currentUser={currentUser}
          users={users}
          directOperation={{
            operation: 'STOCK_VARIANCE_ADJUSTMENT',
            title: `Authorize Stock Adjustment: ${pendingAdjustmentData.product.name}`,
            description: `Delta: ${pendingAdjustmentData.delta > 0 ? `+${pendingAdjustmentData.delta}` : pendingAdjustmentData.delta} ${pendingAdjustmentData.product.unit} (Reason: ${pendingAdjustmentData.reason})`,
            details: `Staff ID: ${currentUser.staffId} | Notes: ${pendingAdjustmentData.notes}`,
            onApproved: executeAdjustment,
          }}
        />
      )}
    </div>
  );
};
