import React, { useState } from 'react';
import { MerchantSale, Organization, Till, User, Sale, Quotation } from '../types';
import { db } from '../services/db';
import { TransactionLifecycleStepper, LifecycleTransaction } from '../components/TransactionLifecycleStepper';
import {
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Printer,
  Ban,
  FileText,
  Building2,
  Calendar,
  Layers,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface SalesAuditScreenProps {
  org: Organization;
  currentTill: Till;
  currentUser: User;
  onViewSaleReceipt: (sale: Sale) => void;
}

export const SalesAuditScreen: React.FC<SalesAuditScreenProps> = ({
  org,
  currentTill,
  currentUser,
  onViewSaleReceipt,
}) => {
  const [merchantSales, setMerchantSales] = useState<MerchantSale[]>(() => db.getMerchantSales() || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'converted' | 'cancelled'>('all');
  const [selectedSale, setSelectedSale] = useState<MerchantSale | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reloadData = () => {
    setMerchantSales(db.getMerchantSales() || []);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredSales = (merchantSales || []).filter((ms) => {
    const matchesStatus = statusFilter === 'all' || ms.status === statusFilter;
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      (ms.merchantOrderNumber || '').toLowerCase().includes(s) ||
      (ms.customerName || '').toLowerCase().includes(s) ||
      (ms.customerPhone && ms.customerPhone.includes(s));
    return matchesStatus && matchesSearch;
  });

  // Build the complete 3-stage lifecycle transaction for the stepper
  const buildLifecycleData = (ms: MerchantSale): LifecycleTransaction => {
    const allQuotes = db.getQuotations() || [];
    const allSales = db.getSales() || [];

    // Find linked quotation
    const quote = allQuotes.find(
      (q) =>
        q.customerId === ms.customerId &&
        (Math.abs(new Date(q.createdAt).getTime() - new Date(ms.createdAt).getTime()) < 86400000 * 3)
    );

    // Find linked final sale
    const sale = allSales.find(
      (s) =>
        s.orderNumber === ms.merchantOrderNumber ||
        s.sourceMerchantSaleId === ms.id ||
        (ms.convertedSaleId && s.id === ms.convertedSaleId)
    );

    return {
      id: ms.id,
      orderNumber: ms.merchantOrderNumber,
      customerName: ms.customerName,
      customerPhone: ms.customerPhone,
      customerKraPin: ms.customerKraPin,
      totalAmount: ms.totalAmount,
      items: ms.items || [],
      quotation: quote
        ? {
            id: quote.id,
            quoteNumber: quote.quoteNumber,
            createdAt: quote.createdAt,
            staffName: quote.attendantFirstName || 'Alex',
            status: quote.status,
            validUntil: quote.validUntil,
          }
        : undefined,
      merchantSale: {
        id: ms.id,
        merchantOrderNumber: ms.merchantOrderNumber,
        createdAt: ms.createdAt,
        staffName: ms.attendantFirstName || currentUser.firstName,
        tillName: ms.tillName || currentTill.name,
        status: ms.status,
      },
      finalSale: sale
        ? {
            id: sale.id,
            receiptNumber: sale.receiptNumber,
            cuNumber: sale.cuNumber,
            createdAt: sale.createdAt,
            staffName: sale.attendantFirstName || currentUser.firstName,
            tillName: sale.tillName || currentTill.name,
            paymentMethod: sale.paymentMethod,
            paymentReference: sale.paymentReference,
            status: sale.status,
          }
        : undefined,
      currentStage: sale ? 'sale' : 'merchant',
    };
  };

  // Convert Merchant Sale to Final ETR Sale with Double-Click Prevention
  const handleConvertToFinalSale = async (merchantSaleId: string) => {
    const ms = merchantSales.find((m) => m.id === merchantSaleId);
    if (!ms || ms.status === 'converted' || convertingId) return;

    setConvertingId(merchantSaleId);

    // Realistic async fiscalization simulation
    await new Promise((resolve) => setTimeout(resolve, 800));

    const sequence = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cuNumber = `${org.etimsCiuSeries}${dateStr}-${sequence}`;
    const receiptNumber = `ETR-${Math.floor(100000 + Math.random() * 900000)}`;

    const taxAmount = (ms.totalAmount * 16) / 116;
    const subtotal = ms.totalAmount - taxAmount;

    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      orderNumber: ms.merchantOrderNumber,
      receiptNumber,
      cuNumber,
      ciuSeries: org.etimsCiuSeries,
      customerId: ms.customerId,
      customerName: ms.customerName,
      customerPhone: ms.customerPhone || '',
      customerAddress: ms.customerAddress,
      customerKraPin: ms.customerKraPin,
      items: ms.items || [],
      subtotal,
      taxAmount,
      discountTotal: 0,
      totalAmount: ms.totalAmount,
      paymentMethod: 'cash',
      paymentDetails: { cashAmount: ms.totalAmount },
      paymentStatus: 'paid',
      tillId: currentTill.id,
      tillName: currentTill.name,
      staffId: currentUser.staffId,
      attendantFirstName: currentUser.firstName,
      createdAt: new Date().toISOString(),
      status: 'completed',
      sourceMerchantSaleId: ms.id,
      auditTimeline: [
        ...(ms.auditTimeline || []),
        {
          title: 'Converted to Final Sale & ETR Issued',
          description: `Authorized by ${currentUser.firstName} (ID: ${currentUser.staffId}) on ${currentTill.name}. CU: ${cuNumber}`,
          timestamp: new Date().toISOString(),
          actor: currentUser.firstName,
          stage: 'sale',
        },
      ],
    };

    // Save final sale
    db.addSale(newSale);

    // Update merchant sale status to converted
    const list = db.getMerchantSales();
    const idx = list.findIndex((x) => x.id === ms.id);
    if (idx >= 0) {
      list[idx].status = 'converted';
      list[idx].convertedSaleId = newSale.id;
      if (!list[idx].auditTimeline) list[idx].auditTimeline = [];
      list[idx].auditTimeline.push({
        title: 'Merchant Sale Converted to Final Sale',
        description: `Transferred to ETR #${newSale.receiptNumber}`,
        timestamp: new Date().toISOString(),
        actor: currentUser.firstName,
        stage: 'sale',
      });
      db.saveMerchantSales(list);
    }

    reloadData();
    setConvertingId(null);
    showToast(`Order #${ms.merchantOrderNumber} successfully converted to Final Fiscal Sale #${receiptNumber}!`);

    // Keep selected sale updated
    setSelectedSale(list[idx] || null);
    onViewSaleReceipt(newSale);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 p-4 sm:p-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#101f42] text-white rounded-xl shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Sales Audit & Transaction Lifecycle
              </h2>
              <p className="text-xs text-slate-500">
                Visual lifecycle audit from Quotation &rarr; Merchant Proforma &rarr; Final Fiscal Sale (ETR).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search merchant order, customer, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#101f42] focus:outline-none"
            />
          </div>

          <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 text-xs shadow-2xs">
            {(['all', 'pending', 'converted', 'cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition ${
                  statusFilter === st
                    ? 'bg-[#101f42] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Datatable */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="p-3.5 font-bold">Order Number</th>
                <th className="p-3.5 font-bold">Customer</th>
                <th className="p-3.5 font-bold">Items & Formulations</th>
                <th className="p-3.5 font-bold">Total Amount</th>
                <th className="p-3.5 font-bold">Attendant & Till</th>
                <th className="p-3.5 font-bold">Created Date</th>
                <th className="p-3.5 font-bold">Lifecycle Status</th>
                <th className="p-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No merchant sales found matching filter.
                  </td>
                </tr>
              ) : (
                filteredSales.map((ms) => {
                  const isPending = ms.status === 'pending';
                  const isConverted = ms.status === 'converted';
                  const isProcessing = convertingId === ms.id;

                  return (
                    <tr key={ms.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-[#101f42]">
                        {ms.merchantOrderNumber}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{ms.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {ms.customerPhone || 'Walk-in'}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>
                          {(ms.items || []).reduce((s, i) => s + (i?.quantity || 0), 0)} units (
                          {(ms.items || []).length} items)
                        </div>
                        {ms.items?.some((it) => it.product?.paintBaseIds?.length > 0) && (
                          <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Paint Formulation Included</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-extrabold text-slate-900">
                        {org.currency} {ms.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>{ms.attendantFirstName} (ID: {ms.staffId})</div>
                        <div className="text-[10px] text-slate-400">{ms.tillName || 'Counter 01'}</div>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {new Date(ms.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isConverted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isConverted ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-600" />
                          )}
                          <span className="uppercase">
                            {isConverted ? 'Final Sale (ETR)' : ms.status}
                          </span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedSale(ms)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition active:scale-95"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Lifecycle Stepper</span>
                        </button>

                        {isPending && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleConvertToFinalSale(ms.id)}
                            className="px-3 py-1 bg-[#101f42] hover:bg-[#1a2b6b] disabled:bg-slate-400 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs transition active:scale-95"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Converting...</span>
                              </>
                            ) : (
                              <>
                                <span>Convert to Sale</span>
                                <ArrowRight className="w-3 h-3" />
                              </>
                            )}
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

      {/* Transaction Lifecycle Stepper Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Transaction Audit Lifecycle Stepper
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological journey: Quotation &rarr; Merchant Order &rarr; Final Fiscal Sale
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            {/* Stepper Component */}
            <TransactionLifecycleStepper
              transaction={buildLifecycleData(selectedSale)}
              org={org}
              currentUser={currentUser}
              onViewReceipt={(saleId) => {
                const s = db.getSales().find((x) => x.id === saleId);
                if (s) {
                  setSelectedSale(null);
                  onViewSaleReceipt(s);
                }
              }}
              onConvertToFinalSale={handleConvertToFinalSale}
            />

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
