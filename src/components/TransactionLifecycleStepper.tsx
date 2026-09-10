import React, { useState } from 'react';
import { Sale, MerchantSale, Quotation, Organization, User } from '../types';
import {
  FileText,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Printer,
  Calendar,
  UserCheck,
  CreditCard,
  Building2,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export interface LifecycleTransaction {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerKraPin?: string;
  totalAmount: number;
  items: any[];
  quotation?: {
    id: string;
    quoteNumber: string;
    createdAt: string;
    staffName: string;
    status: string;
    validUntil?: string;
  };
  merchantSale?: {
    id: string;
    merchantOrderNumber: string;
    createdAt: string;
    staffName: string;
    tillName: string;
    status: string;
  };
  finalSale?: {
    id: string;
    receiptNumber: string;
    cuNumber: string;
    createdAt: string;
    staffName: string;
    tillName: string;
    paymentMethod: string;
    paymentReference?: string;
    status: string;
  };
  currentStage: 'quotation' | 'merchant' | 'sale';
}

interface TransactionLifecycleStepperProps {
  transaction: LifecycleTransaction;
  org: Organization;
  currentUser: User;
  onViewReceipt?: (saleId: string) => void;
  onConvertToFinalSale?: (merchantSaleId: string) => Promise<void> | void;
}

export const TransactionLifecycleStepper: React.FC<TransactionLifecycleStepperProps> = ({
  transaction,
  org,
  currentUser,
  onViewReceipt,
  onConvertToFinalSale,
}) => {
  const [isConverting, setIsConverting] = useState(false);

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Pending / Not Reached';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getDurationString = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return null;
    try {
      const diffMs = Math.abs(new Date(endStr).getTime() - new Date(startStr).getTime());
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `+${mins}m elapsed`;
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `+${hrs}h ${remMins}m elapsed`;
    } catch {
      return null;
    }
  };

  const hasQuote = Boolean(transaction.quotation);
  const hasMerchant = Boolean(transaction.merchantSale);
  const hasFinalSale = Boolean(transaction.finalSale);

  const quoteTime = transaction.quotation?.createdAt;
  const merchantTime = transaction.merchantSale?.createdAt;
  const saleTime = transaction.finalSale?.createdAt;

  const quoteToMerchantDuration = getDurationString(quoteTime, merchantTime);
  const merchantToSaleDuration = getDurationString(merchantTime, saleTime);

  const handleConvertClick = async () => {
    if (isConverting || !transaction.merchantSale) return;
    setIsConverting(true);
    try {
      if (onConvertToFinalSale) {
        await onConvertToFinalSale(transaction.merchantSale.id);
      }
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Top Banner with Transaction Summary */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded">
              Lifecycle Stepper Audit
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Ref: {transaction.finalSale?.receiptNumber || transaction.merchantSale?.merchantOrderNumber || transaction.quotation?.quoteNumber || transaction.orderNumber}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>{transaction.customerName}</span>
            {transaction.customerKraPin && (
              <span className="text-xs font-mono font-normal text-slate-300">
                (PIN: {transaction.customerKraPin})
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left sm:text-right">
            <div className="text-[11px] text-slate-400 font-medium">Order Value</div>
            <div className="text-lg font-extrabold text-white font-mono">
              {org.currency} {transaction.totalAmount.toLocaleString()}
            </div>
          </div>

          {hasFinalSale && onViewReceipt && (
            <button
              type="button"
              onClick={() => onViewReceipt(transaction.finalSale!.id)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>58mm ETR Slip</span>
            </button>
          )}

          {!hasFinalSale && hasMerchant && onConvertToFinalSale && (
            <button
              type="button"
              disabled={isConverting}
              onClick={handleConvertClick}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fiscalizing ETR...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Convert to Final Sale</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Stepper Progress Visualizer */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* STEP 1: Quotation */}
          <div
            className={`relative p-4 rounded-xl border transition-all ${
              hasQuote
                ? 'bg-white border-blue-300 shadow-xs'
                : 'bg-slate-100/70 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  hasQuote
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  hasQuote
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {hasQuote ? 'Stage 1: Completed' : 'Bypassed (Direct Order)'}
              </span>
            </div>

            <div className="text-xs font-bold text-slate-900 mb-0.5">1. Quotation Proforma</div>
            <div className="text-[11px] font-mono font-semibold text-blue-700">
              {transaction.quotation?.quoteNumber || (hasQuote ? 'QT-PROFORMA' : 'N/A')}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Timestamp:</span>
                <span className="font-mono text-slate-800">
                  {hasQuote ? formatTimestamp(quoteTime) : 'Direct Walk-in'}
                </span>
              </div>
              {hasQuote && (
                <div className="flex justify-between text-slate-500">
                  <span>Created By:</span>
                  <span className="text-slate-800 font-medium">
                    {transaction.quotation?.staffName || currentUser.firstName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Merchant Sale */}
          <div
            className={`relative p-4 rounded-xl border transition-all ${
              hasMerchant
                ? 'bg-white border-indigo-300 shadow-xs'
                : 'bg-slate-100/70 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  hasMerchant
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    hasMerchant && hasFinalSale
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : hasMerchant
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {hasMerchant && hasFinalSale
                    ? 'Stage 2: Converted'
                    : hasMerchant
                    ? 'Stage 2: Active Pending ETR'
                    : 'Pending'}
                </span>
                {quoteToMerchantDuration && (
                  <span className="text-[10px] text-blue-600 font-mono mt-0.5">
                    {quoteToMerchantDuration}
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs font-bold text-slate-900 mb-0.5">2. Merchant Order (Proforma)</div>
            <div className="text-[11px] font-mono font-semibold text-indigo-700">
              {transaction.merchantSale?.merchantOrderNumber || transaction.orderNumber}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Timestamp:</span>
                <span className="font-mono text-slate-800">
                  {formatTimestamp(merchantTime || quoteTime)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Till / Attendant:</span>
                <span className="text-slate-800 font-medium">
                  {transaction.merchantSale?.tillName || 'Counter 01'} (
                  {transaction.merchantSale?.staffName || currentUser.firstName})
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3: Final Fiscal Sale */}
          <div
            className={`relative p-4 rounded-xl border transition-all ${
              hasFinalSale
                ? 'bg-white border-emerald-400 shadow-xs'
                : 'bg-amber-50/50 border-amber-200 text-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  hasFinalSale
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    hasFinalSale
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {hasFinalSale ? 'Stage 3: Fiscalized ETR' : 'Awaiting Fiscalization'}
                </span>
                {merchantToSaleDuration && (
                  <span className="text-[10px] text-emerald-600 font-mono mt-0.5">
                    {merchantToSaleDuration}
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs font-bold text-slate-900 mb-0.5">3. Final Sale (KRA eTIMS ETR)</div>
            <div className="text-[11px] font-mono font-bold text-emerald-700">
              {transaction.finalSale?.receiptNumber || 'ETR-PENDING'}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Fiscalized At:</span>
                <span className="font-mono text-slate-800">
                  {formatTimestamp(saleTime)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>eTIMS CU Number:</span>
                <span className="font-mono text-slate-800 text-[10px]">
                  {transaction.finalSale?.cuNumber || 'Pending Conversion'}
                </span>
              </div>
              {hasFinalSale && (
                <div className="flex justify-between text-slate-500">
                  <span>Tender / Ref:</span>
                  <span className="font-mono font-bold text-slate-900 uppercase">
                    {transaction.finalSale?.paymentMethod}{' '}
                    {transaction.finalSale?.paymentReference &&
                      `(${transaction.finalSale.paymentReference})`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Item Details with Paint Formulation Constituents */}
      <div className="p-4 sm:p-5">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Itemized Products & Paint Formulations</span>
          <span className="text-[11px] text-slate-400 font-normal">
            {(transaction.items || []).length} lines
          </span>
        </h4>

        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
          {(transaction.items || []).map((it, idx) => {
            const prodName = it.product?.name || it.productName || 'Hardware Item';
            const bases = it.product?.paintBaseIds || [];
            const hasBases = bases.length > 0;

            return (
              <div
                key={idx}
                className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 transition"
              >
                <div>
                  <div className="font-bold text-slate-900">{prodName}</div>
                  {/* Constituent Paint Bases display */}
                  {hasBases && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex font-medium">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Formulation Bases: {bases.join(', ')}</span>
                    </div>
                  )}
                  {it.selectedPaintBaseId && !hasBases && (
                    <div className="text-[11px] text-purple-700">
                      Tint Base: {it.selectedPaintBaseId}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {it.quantity} {it.product?.unit || 'Units'} × {org.currency}{' '}
                    {(it.unitPrice || 0).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-extrabold text-slate-900 text-sm">
                    {org.currency} {(it.total || (it.quantity || 1) * (it.unitPrice || 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
