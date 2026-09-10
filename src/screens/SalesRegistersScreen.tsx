import React, { useState } from 'react';
import { Organization, Till, User, Sale, MerchantSale, Quotation } from '../types';
import { db } from '../services/db';
import {
  Receipt,
  FileCheck2,
  FileText,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
  Printer,
  Calendar,
  Filter,
} from 'lucide-react';

interface SalesRegistersScreenProps {
  org: Organization;
  currentTill: Till;
  currentUser: User;
  onViewReceipt: (sale: Sale) => void;
  onConvertMerchantSale: (ms: MerchantSale) => void;
  onConvertQuote: (quote: Quotation) => void;
}

export const SalesRegistersScreen: React.FC<SalesRegistersScreenProps> = ({
  org,
  onViewReceipt,
  onConvertMerchantSale,
  onConvertQuote,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'fiscal' | 'merchant' | 'quotes'>('fiscal');
  const [searchTerm, setSearchTerm] = useState('');

  const sales = db.getSales();
  const merchantSales = db.getMerchantSales();
  const quotations = db.getQuotations();

  const filteredSales = sales.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      (s.ciuSeries || '').toLowerCase().includes(q) ||
      (s.receiptNumber || '').toLowerCase().includes(q) ||
      (s.customerName || '').toLowerCase().includes(q) ||
      (s.customerKraPin || '').toLowerCase().includes(q)
    );
  });

  const filteredMerchant = merchantSales.filter((ms) => {
    const q = searchTerm.toLowerCase();
    return (
      ms.merchantOrderNumber.toLowerCase().includes(q) ||
      ms.customerName.toLowerCase().includes(q)
    );
  });

  const filteredQuotes = quotations.filter((q) => {
    const query = searchTerm.toLowerCase();
    return (
      q.quoteNumber.toLowerCase().includes(query) ||
      q.customerName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Sub-Tab Switcher - Exact from screenshot 5 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Sales Registers & Quotations
          </h2>
          <p className="text-xs text-slate-500">
            Audit logs for KRA eTIMS CIU invoices, merchant trade sales, and 14-day formal quotes.
          </p>
        </div>

        {/* 3 Pills: Fiscal Sales (ETR), Merchant Sales, Quotations - Solid colors, no gradients */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('fiscal')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'fiscal'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Fiscal Sales (ETR)</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
              activeSubTab === 'fiscal' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {sales.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('merchant')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'merchant'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Merchant Sales</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
              activeSubTab === 'merchant' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {merchantSales.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('quotes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'quotes'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quotations</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
              activeSubTab === 'quotes' ? 'bg-[#f59e0b] text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {quotations.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by series, invoice, customer name, KRA PIN..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#101f42]"
        />
      </div>

      {/* Tab 1: Fiscal Sales (ETR) - Exact Table from Screenshot 5 */}
      {activeSubTab === 'fiscal' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                KRA ETR Fiscal Invoices (Sequential CIU Series)
              </h3>
              <p className="text-[11px] text-slate-500">
                Includes Customer KRA PIN for B2B trade
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total Fiscal: {org.currency} {(sales || []).reduce((sum, s) => sum + (s?.totalAmount || 0), 0).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">CIU Invoice Series</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer & PIN</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4">Payment Tender</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No fiscal receipts match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {s.ciuSeries || s.cuNumber || s.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(s.createdAt).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{s.customerName || 'Walk-in Retail Customer'}</div>
                        {s.customerKraPin && (
                          <div className="text-[10px] text-blue-700 font-mono font-bold">
                            PIN: {s.customerKraPin}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {(s.items || []).reduce((acc, it) => acc + (it?.quantity || 0), 0)} Units ({(s.items || []).length} Lines)
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {s.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                        {org.currency} {s.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(s)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1.5 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Merchant Sales */}
      {activeSubTab === 'merchant' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Merchant Trade Sales (Non-Fiscal Internal Orders)
              </h3>
              <p className="text-[11px] text-slate-500">
                Inventory is decremented immediately. Can be converted to KRA ETR Fiscal Sale upon client request.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total Merchant: {org.currency} {(merchantSales || []).reduce((sum, m) => sum + (m?.totalAmount || 0), 0).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4">Conversion Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMerchant.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No merchant sales recorded.
                    </td>
                  </tr>
                ) : (
                  filteredMerchant.map((ms) => (
                    <tr key={ms.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                        {ms.merchantOrderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(ms.createdAt).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ms.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {(ms.items || []).reduce((acc, it) => acc + (it?.quantity || 0), 0)} Units ({(ms.items || []).length} Lines)
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                        {org.currency} {ms.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {ms.status === 'converted' ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Converted to CIU</span>
                          </span>
                        ) : (
                          <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                            Non-Fiscal Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {ms.status !== 'converted' && (
                          <button
                            type="button"
                            onClick={() => onConvertMerchantSale(ms)}
                            className="px-3 py-1 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-[11px] font-bold rounded-lg shadow-2xs inline-flex items-center gap-1"
                          >
                            <span>Convert to Fiscal (ETR)</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Quotations */}
      {activeSubTab === 'quotes' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                14-Day Formal Trade Quotations
              </h3>
              <p className="text-[11px] text-slate-500">
                Lock prices for clients. Auto-expires if not converted within 14 days.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total Quotes: {org.currency} {(quotations || []).reduce((sum, q) => sum + (q?.totalAmount || 0), 0).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Quote #</th>
                  <th className="py-3 px-4">Date Created</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No active quotations found.
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-900">
                        {quote.quoteNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {quote.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">
                        <span className="flex items-center gap-1 text-amber-700 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          {quote.validUntil}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                        {org.currency} {quote.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          quote.status.startsWith('converted')
                            ? 'bg-emerald-100 text-emerald-800'
                            : quote.status === 'expired'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {quote.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {quote.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => onConvertQuote(quote)}
                            className="px-3 py-1 bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 text-[11px] font-extrabold rounded-lg shadow-2xs inline-flex items-center gap-1"
                          >
                            <span>Convert to POS Cart</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
