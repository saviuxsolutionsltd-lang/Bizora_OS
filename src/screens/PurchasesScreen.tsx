import React, { useState } from 'react';
import { PurchaseOrder, Supplier, Product, Organization, User } from '../types';
import { db } from '../services/db';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  FileCheck,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Package,
} from 'lucide-react';

interface PurchasesScreenProps {
  suppliers: Supplier[];
  products: Product[];
  org: Organization;
  currentUser: User;
  onReloadProducts: () => void;
}

export const PurchasesScreen: React.FC<PurchasesScreenProps> = ({
  suppliers,
  products,
  org,
  currentUser,
  onReloadProducts,
}) => {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => db.getPurchases() || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [orderItems, setOrderItems] = useState<
    { productId: string; selectedBase?: string; quantity: number; unitCost: number }[]
  >([]);
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);
  const [isReceivingGRN, setIsReceivingGRN] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formValidationErrors, setFormValidationErrors] = useState<string[]>([]);

  const reloadData = () => {
    setPurchases(db.getPurchases() || []);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredPurchases = purchases.filter((po) => {
    const s = searchTerm.toLowerCase();
    return (
      (po.poNumber || '').toLowerCase().includes(s) ||
      (po.supplierName || '').toLowerCase().includes(s) ||
      (po.grnNumber && po.grnNumber.toLowerCase().includes(s))
    );
  });

  const handleReceiveGRN = async (po: PurchaseOrder) => {
    if (po.status === 'received' || isReceivingGRN) return;
    setIsReceivingGRN(true);

    // Simulate async inventory update
    await new Promise((resolve) => setTimeout(resolve, 800));

    const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    // Auto increment inventory stock
    const prods = db.getProducts();
    po.items.forEach((item) => {
      const p = prods.find((x) => x.id === item.productId);
      if (p) {
        p.stockQuantity += item.quantity;
      }
    });
    db.saveProducts(prods);

    // Update PO status
    const all = db.getPurchases();
    const idx = all.findIndex((x) => x.id === po.id);
    if (idx >= 0) {
      all[idx].status = 'received';
      all[idx].grnNumber = grnNumber;
      all[idx].receivedAt = now;
      db.savePurchases(all);
    }

    // Add audit log
    db.addAuditLog({
      id: `AUD-GRN-${Date.now()}`,
      timestamp: now,
      action: 'PURCHASE_GRN_RECEIVED',
      module: 'PURCHASES',
      staffId: currentUser.staffId,
      staffName: currentUser.firstName,
      tillId: 'WAREHOUSE',
      details: `Received Goods Received Note #${grnNumber} for PO #${po.poNumber} from ${po.supplierName}. Stock quantities incremented.`,
      severity: 'info',
      ipOrDevice: 'Warehouse Terminal',
    });

    onReloadProducts();
    reloadData();
    setSelectedPO(null);
    setIsReceivingGRN(false);
    showToast(`Goods Received Note #${grnNumber} processed! Inventory stock updated.`);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPO) return;

    const errors: string[] = [];
    const supp = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
    if (!supp) errors.push('Please select a valid supplier');
    if (orderItems.length === 0) errors.push('Please add at least 1 item to the purchase order');
    if (orderItems.some((oi) => oi.quantity <= 0)) errors.push('Quantity must be greater than 0 for all items');
    if (orderItems.some((oi) => oi.unitCost <= 0)) errors.push('Unit purchase cost must be greater than 0');

    if (errors.length > 0) {
      setFormValidationErrors(errors);
      return;
    }

    setFormValidationErrors([]);
    setIsSubmittingPO(true);

    // Simulate async network request
    await new Promise((resolve) => setTimeout(resolve, 600));

    const timestamp = new Date().toISOString();
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;

    const items = orderItems.map((oi) => {
      const p = products.find((x) => x.id === oi.productId);
      const baseSuffix = oi.selectedBase ? ` [Raw Base: ${oi.selectedBase}]` : '';
      return {
        productId: oi.productId,
        productName: p ? `${p.name}${baseSuffix}` : 'Hardware Item',
        quantity: oi.quantity,
        unitCost: oi.unitCost,
        total: oi.quantity * oi.unitCost,
      };
    });

    const totalAmount = items.reduce((s, i) => s + i.total, 0);

    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      poNumber,
      supplierId: supp.id,
      supplierName: supp.name,
      items,
      totalAmount,
      status: 'ordered',
      createdAt: timestamp,
    };

    db.addPurchase(newPO);
    reloadData();
    setIsSubmittingPO(false);
    setIsCreateOpen(false);
    setOrderItems([]);
    showToast(`Purchase Order #${poNumber} placed successfully with ${supp.name}!`);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 p-4 sm:p-6 space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-800 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#101f42] text-white rounded-xl shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Purchases, Suppliers & GRN Receiving
              </h2>
              <p className="text-xs text-slate-500">
                Procure raw paint bases, track Purchase Orders, and issue Goods Received Notes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search PO #, supplier, GRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#101f42] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFormValidationErrors([]);
              setIsCreateOpen(true);
            }}
            className="px-3.5 py-1.5 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Datatable */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="p-3.5 font-bold">PO Number</th>
                <th className="p-3.5 font-bold">Supplier</th>
                <th className="p-3.5 font-bold">Items & Bases</th>
                <th className="p-3.5 font-bold">Order Value</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold">GRN Number</th>
                <th className="p-3.5 font-bold">Date Ordered</th>
                <th className="p-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No purchase orders recorded yet. Click "New Purchase Order" to begin.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => {
                  const isReceived = po.status === 'received';

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-[#101f42]">{po.poNumber}</td>
                      <td className="p-3.5 font-bold text-slate-900">{po.supplierName}</td>
                      <td className="p-3.5 text-slate-600">
                        <div>
                          {po.items.reduce((s, i) => s + i.quantity, 0)} units ({po.items.length} lines)
                        </div>
                        {po.items.some((i) => i.productName?.includes('Raw Base:')) && (
                          <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 inline-block">
                            Raw Paint Bases
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-extrabold text-slate-900">
                        {org.currency} {po.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isReceived
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isReceived ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{po.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {po.grnNumber || <span className="text-slate-400 italic">Pending Delivery</span>}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPO(po)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          View PO
                        </button>
                        {!isReceived && (
                          <button
                            type="button"
                            onClick={() => setSelectedPO(po)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            <span>Receive GRN</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleCreatePO}
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">New Purchase Order</h3>
                <p className="text-slate-500 text-[11px]">
                  Procure raw paint bases individually or standard hardware supplies.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Validation Error Banner */}
            {formValidationErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Please resolve the following before placing order:</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] text-rose-700 space-y-0.5">
                  {formValidationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Select Supplier *
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#101f42]"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Contact: {s.contactPerson})
                  </option>
                ))}
              </select>
            </div>

            {/* Products Selector with Paint Base Option */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Procure Products & Select Constituent Raw Bases:
              </label>
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-2 bg-slate-50">
                {products.slice(0, 8).map((p) => {
                  const hasBases = p.paintBaseIds && p.paintBaseIds.length > 0;
                  const unitCost = p.costPrice || p.buyingPrice || p.sellingPrice * 0.75;

                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Cost: {org.currency} {unitCost.toLocaleString()} / {p.unit}
                          </div>
                        </div>

                        {!hasBases && (
                          <button
                            type="button"
                            onClick={() =>
                              setOrderItems((prev) => [
                                ...prev,
                                { productId: p.id, quantity: 10, unitCost },
                              ])
                            }
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold text-[11px] hover:bg-blue-100"
                          >
                            + Add 10 {p.unit}
                          </button>
                        )}
                      </div>

                      {/* When product has paint bases: allow selecting individual base! */}
                      {hasBases && (
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2 space-y-1.5">
                          <div className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-700" />
                            <span>Select Individual Base to Procure from Manufacturer:</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {p.paintBaseIds.map((base) => {
                              const alreadyAdded = orderItems.find(
                                (oi) => oi.productId === p.id && oi.selectedBase === base
                              );

                              return (
                                <button
                                  key={base}
                                  type="button"
                                  onClick={() => {
                                    if (alreadyAdded) {
                                      setOrderItems((prev) =>
                                        prev.filter(
                                          (oi) =>
                                            !(oi.productId === p.id && oi.selectedBase === base)
                                        )
                                      );
                                    } else {
                                      setOrderItems((prev) => [
                                        ...prev,
                                        {
                                          productId: p.id,
                                          selectedBase: base,
                                          quantity: 15,
                                          unitCost,
                                        },
                                      ]);
                                    }
                                  }}
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold border transition ${
                                    alreadyAdded
                                      ? 'bg-amber-600 text-white border-amber-600'
                                      : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                                  }`}
                                >
                                  {alreadyAdded ? `✓ Added: ${base} (15 Tins)` : `+ Procure ${base}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Currently Selected Items in PO */}
            {orderItems.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase">
                  Order Lines to Procure ({orderItems.length}):
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {orderItems.map((oi, idx) => {
                    const p = products.find((x) => x.id === oi.productId);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <div>
                          <span className="font-bold">{p?.name}</span>
                          {oi.selectedBase && (
                            <span className="ml-1 text-[10px] text-amber-800 font-medium">
                              [{oi.selectedBase}]
                            </span>
                          )}
                          <div className="text-[10px] text-slate-500 font-mono">
                            {oi.quantity} units × {org.currency} {oi.unitCost.toLocaleString()} ={' '}
                            {org.currency} {(oi.quantity * oi.unitCost).toLocaleString()}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setOrderItems((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-rose-600 text-[11px] font-bold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-slate-600 font-bold">
                Total: {org.currency}{' '}
                {orderItems.reduce((s, i) => s + i.quantity * i.unitCost, 0).toLocaleString()}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPO || orderItems.length === 0}
                  className="px-5 py-2 bg-[#101f42] hover:bg-[#1a2b6b] disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md flex items-center gap-2"
                >
                  {isSubmittingPO ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <span>Place Purchase Order</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* PO Details & GRN Receiving Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Purchase Order #{selectedPO.poNumber}
                </h3>
                <p className="text-slate-500 text-[11px]">Supplier: {selectedPO.supplierName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPO(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {selectedPO.items.map((it, idx) => (
                <div key={idx} className="p-3 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900">{it.productName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {it.quantity} units @ {org.currency} {it.unitCost.toLocaleString()}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    {org.currency} {it.total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm font-extrabold text-slate-900">
                Total: {org.currency} {selectedPO.totalAmount.toLocaleString()}
              </div>

              {selectedPO.status !== 'received' ? (
                <button
                  type="button"
                  disabled={isReceivingGRN}
                  onClick={() => handleReceiveGRN(selectedPO)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5 transition active:scale-95"
                >
                  {isReceivingGRN ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Posting to Stock...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Receive Goods & Post to Stock (GRN)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>GRN #{selectedPO.grnNumber} Received</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
