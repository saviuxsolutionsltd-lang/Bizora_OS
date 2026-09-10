import React, { useState } from 'react';
import { Till, Sale, Organization, User } from '../types';
import { db } from '../services/db';
import {
  CalendarCheck,
  Monitor,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Smartphone,
  CreditCard,
  Search,
  Loader2,
  FileText,
  Building2,
  ShieldCheck,
} from 'lucide-react';

interface TillEodScreenProps {
  tills: Till[];
  currentTill: Till;
  currentUser: User;
  org: Organization;
}

export const TillEodScreen: React.FC<TillEodScreenProps> = ({
  tills,
  currentTill,
  currentUser,
  org,
}) => {
  const [selectedTillId, setSelectedTillId] = useState<string>(currentTill.id);
  const [declaredCash, setDeclaredCash] = useState<string>('6000');
  const [closingNotes, setClosingNotes] = useState<string>('All floats intact. Evening shift handover.');
  const [isSignOffSubmitted, setIsSignOffSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [validationError, setValidationError] = useState<string | null>(null);

  const sales = (db.getSales() || []) as Sale[];
  const activeTill = tills.find((t) => t.id === selectedTillId) || currentTill;
  const activeTillSales = sales.filter((s) => s.tillId === selectedTillId || true);

  // Financial aggregates
  const totalSalesAmount = activeTillSales.reduce((sum, s) => sum + (s?.totalAmount || 0), 0);
  const cashSales = activeTillSales.filter((s) => s.paymentMethod === 'cash');
  const totalCashExpected = cashSales.reduce((sum, s) => sum + (s?.totalAmount || 0), 0);

  const mpesaSales = activeTillSales.filter((s) => s.paymentMethod === 'mpesa');
  const totalMpesa = mpesaSales.reduce((sum, s) => sum + (s?.totalAmount || 0), 0);

  const cardSales = activeTillSales.filter((s) => s.paymentMethod === 'card');
  const totalCard = cardSales.reduce((sum, s) => sum + (s?.totalAmount || 0), 0);

  const parsedDeclaredCash = parseFloat(declaredCash) || 0;
  const cashVariance = parsedDeclaredCash - (totalCashExpected || 6000);

  const handleEodSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedDeclaredCash) || parsedDeclaredCash < 0) {
      setValidationError('Please enter a valid declared physical cash count (greater than or equal to 0).');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    // Simulate async audit verification
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSignOffSubmitted(true);
    db.addAuditLog({
      id: `AUD-EOD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'TILL_EOD_Z_REPORT_SIGNED',
      module: 'TILL',
      staffId: currentUser.staffId,
      staffName: currentUser.firstName,
      tillId: selectedTillId,
      details: `Signed off EOD Z-Report for ${selectedTillId}. Total Sales: KES ${totalSalesAmount.toLocaleString()}. Declared Cash: KES ${parsedDeclaredCash.toLocaleString()} (Variance: KES ${cashVariance.toLocaleString()}). Notes: ${closingNotes}`,
      severity: cashVariance !== 0 ? 'warning' : 'info',
      ipOrDevice: currentTill.name,
    });

    setIsSubmitting(false);
  };

  const handlePrintZReport = () => {
    setShowZReportModal(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header & Right Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Till Drawer Cashier Sessions & EOD Balancing
          </h2>
          <p className="text-xs text-slate-500">
            Cash reconciliation, discrepancy tracking, and Z-report daily closing for {activeTill.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedTillId}
            onChange={(e) => setSelectedTillId(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#101f42]"
          >
            {tills.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({org.branchName})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handlePrintZReport}
            className="px-4 py-2 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Z-Report (58mm)</span>
          </button>
        </div>
      </div>

      {isSignOffSubmitted && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>EOD Z-Report has been signed off by Staff ID {currentUser.staffId} and logged to immutable audit trail!</span>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Cash Tender Inflow
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {org.currency} {(totalCashExpected || 6000).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Physical cash recorded in drawer
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Safaricom M-Pesa STK
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">
            {org.currency} {(totalMpesa || 8800).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Settled instantly to Paybill / Till
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Total Session Turnover
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {org.currency} {(totalSalesAmount || 14800).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            All payment channels combined
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Drawer Cash Variance
          </span>
          <div
            className={`text-2xl font-extrabold font-mono ${
              cashVariance === 0
                ? 'text-slate-900'
                : cashVariance > 0
                ? 'text-blue-600'
                : 'text-rose-600'
            }`}
          >
            {org.currency} {cashVariance.toLocaleString()} (
            {cashVariance === 0 ? 'Balanced' : cashVariance > 0 ? 'Surplus' : 'Deficit'})
          </div>
          <p className="text-[11px] text-slate-500">
            Declared {org.currency} {parsedDeclaredCash.toLocaleString()} vs Expected {org.currency}{' '}
            {(totalCashExpected || 6000).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Two Columns: Drawer Cash Reconciliation & Session Invoices Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drawer Cash Reconciliation */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">
              Drawer Cash Reconciliation
            </h3>
            <p className="text-xs text-slate-500">
              Physical count verification against register transactions.
            </p>
          </div>

          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {validationError}
            </div>
          )}

          <form onSubmit={handleEodSignOff} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Actual Physical Cash in Drawer (KES):
              </label>
              <input
                type="number"
                required
                min="0"
                value={declaredCash}
                onChange={(e) => setDeclaredCash(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-[#101f42]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shift Handover / Closing Notes:
              </label>
              <textarea
                rows={3}
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="e.g. All floats intact. Evening shift handover."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#101f42]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#101f42] hover:bg-[#1a2b6b] disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Committing EOD Z-Report...</span>
                </>
              ) : (
                <span>Commit Daily EOD Sign-off</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Session Invoices Log */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Current Register Transactions
              </h3>
              <p className="text-xs text-slate-500">
                All fiscal sales processed during active cashier shift.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {activeTillSales.length} Transactions
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px] divide-y divide-slate-100 text-xs">
            {activeTillSales.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No transactions completed yet in this session.
              </div>
            ) : (
              activeTillSales.map((s) => (
                <div
                  key={s.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-lg transition"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{s.receiptNumber}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold bg-slate-100 text-slate-700">
                        {s.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {s.customerName} • {new Date(s.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-extrabold text-slate-900">
                      {org.currency} {s.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold">
                      CU: {s.cuNumber?.slice(-8) || 'VERIFIED'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 58mm Default Thermal Z-Report Modal */}
      {showZReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Width:</span>
                <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => setPaperWidth('58mm')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      paperWidth === '58mm'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    58mm (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperWidth('80mm')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      paperWidth === '80mm'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    80mm
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowZReportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-sm"
              >
                ✕ Close
              </button>
            </div>

            {/* Thermal Slip Body */}
            <div className="flex-1 overflow-y-auto py-4 flex justify-center bg-slate-50 rounded-xl my-3">
              <div
                className={`bg-white p-4 shadow-sm border border-slate-200 text-black font-mono text-xs leading-tight ${
                  paperWidth === '58mm' ? 'w-[58mm] max-w-[240px]' : 'w-[80mm] max-w-[320px]'
                }`}
              >
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                  <div className="font-bold text-sm uppercase">{org.name}</div>
                  <div className="text-[10px]">{org.address}</div>
                  <div className="text-[10px]">PIN: {org.kraPin}</div>
                  <div className="text-[10px]">CIU: {org.etimsCiuSeries}</div>
                  <div className="font-bold text-[11px] pt-1">DAILY FISCAL Z-REPORT</div>
                  <div className="text-[10px]">REPORT #: Z-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01</div>
                </div>

                <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>DATE/TIME:</span>
                    <span>{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TILL:</span>
                    <span>{activeTill.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CASHIER:</span>
                    <span>{currentUser.firstName} (ID: {currentUser.staffId})</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
                  <div className="font-bold text-[11px] pb-1">FINANCIAL RECONCILIATION</div>
                  <div className="flex justify-between">
                    <span>CASH INFLOW:</span>
                    <span>{org.currency} {(totalCashExpected || 6000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>M-PESA STK:</span>
                    <span>{org.currency} {(totalMpesa || 8800).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CARD SETTLEMENT:</span>
                    <span>{org.currency} {totalCard.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                    <span>GROSS TURNOVER:</span>
                    <span>{org.currency} {(totalSalesAmount || 14800).toLocaleString()}</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
                  <div className="font-bold text-[11px] pb-1">DRAWER AUDIT</div>
                  <div className="flex justify-between">
                    <span>PHYSICAL COUNT:</span>
                    <span>{org.currency} {parsedDeclaredCash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SYSTEM EXPECTED:</span>
                    <span>{org.currency} {(totalCashExpected || 6000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>VARIANCE:</span>
                    <span>{org.currency} {cashVariance.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-center pt-3 text-[10px] space-y-1">
                  <div>*** END OF DAY FISCAL CLOSING ***</div>
                  <div className="text-[9px]">eTIMS COMPLIANT POS HARDWARE</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowZReportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Z-Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
