import React, { useState } from 'react';
import { Quotation, Organization, Till, User, Product, MerchantSale, Sale } from '../types';
import { db } from '../services/db';
import {
  FileText,
  Search,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Trash2,
  Eye,
  Calendar,
} from 'lucide-react';

interface QuotationsScreenProps {
  org: Organization;
  currentTill: Till;
  currentUser: User;
  products: Product[];
  onViewSaleReceipt: (sale: Sale) => void;
}

export const QuotationsScreen: React.FC<QuotationsScreenProps> = ({
  org,
  currentTill,
  currentUser,
  products,
  onViewSaleReceipt,
}) => {
  const [quotations, setQuotations] = useState<Quotation[]>(() => db.getQuotations());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  // New Quote Modal
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [validDays, setValidDays] = useState(14);
  const [selectedItems, setSelectedItems] = useState<{ product: Product; quantity: number }[]>([]);

  const reloadData = () => {
    const list = db.getQuotations();
    // Check auto-expiration
    const today = new Date().toISOString().split('T')[0];
    list.forEach((q) => {
      if (q.status === 'active' && q.validUntil < today) {
        q.status = 'expired';
      }
    });
    db.saveQuotations(list);
    setQuotations(list);
  };

  const filteredQuotes = quotations.filter((q) => {
    const s = searchTerm.toLowerCase();
    return (
      q.quoteNumber.toLowerCase().includes(s) ||
      q.customerName.toLowerCase().includes(s) ||
      (q.customerPhone && q.customerPhone.includes(s))
    );
  });

  // Convert to Merchant Sale
  const handleConvertToMerchant = (quote: Quotation) => {
    const merchantOrderNumber = `MS-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    const merchantSale: MerchantSale = {
      id: `MSALE-${Date.now()}`,
      merchantOrderNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      items: quote.items,
      subtotal: quote.subtotal,
      totalAmount: quote.totalAmount,
      status: 'pending',
      tillId: currentTill.id,
      tillName: currentTill.name,
      staffId: currentUser.staffId,
      attendantFirstName: currentUser.firstName,
      createdAt: timestamp,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      auditTimeline: [
        ...(quote.auditTimeline || []),
        {
          title: 'Quotation Converted to Merchant Sale',
          description: `Transferred to Merchant Order #${merchantOrderNumber} by ${currentUser.firstName}`,
          timestamp,
          actor: currentUser.firstName,
          stage: 'merchant',
        },
      ],
    };

    db.addMerchantSale(merchantSale);

    // Update quotation status
    const allQuotes = db.getQuotations();
    const idx = allQuotes.findIndex((q) => q.id === quote.id);
    if (idx >= 0) {
      allQuotes[idx].status = 'converted_merchant';
      allQuotes[idx].auditTimeline.push({
        title: 'Converted to Merchant Sale',
        description: `Linked to #${merchantOrderNumber}`,
        timestamp,
        actor: currentUser.firstName,
        stage: 'merchant',
      });
      db.saveQuotations(allQuotes);
    }

    reloadData();
    setSelectedQuote(null);
    alert(`Quotation #${quote.quoteNumber} successfully converted to Merchant Sale #${merchantOrderNumber}!`);
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0 || !custName.trim()) return;

    const timestamp = new Date().toISOString();
    const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
    const validUntil = new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0];

    const cartItems = selectedItems.map((si) => ({
      product: si.product,
      quantity: si.quantity,
      unitPrice: si.product.sellingPrice,
      discount: 0,
      total: si.quantity * si.product.sellingPrice,
    }));

    const total = cartItems.reduce((s, i) => s + i.total, 0);

    const newQuote: Quotation = {
      id: `QT-${Date.now()}`,
      quoteNumber,
      customerId: 'CUST-NEW',
      customerName: custName.trim(),
      customerPhone: custPhone.trim(),
      items: cartItems,
      subtotal: total / 1.16,
      totalAmount: total,
      validUntil,
      status: 'active',
      tillId: currentTill.id,
      staffId: currentUser.staffId,
      attendantFirstName: currentUser.firstName,
      createdAt: timestamp,
      auditTimeline: [
        {
          title: 'Quotation Created',
          description: `Prepared for ${custName} by ${currentUser.firstName} (Staff ID ${currentUser.staffId})`,
          timestamp,
          actor: currentUser.firstName,
          stage: 'quotation',
        },
      ],
    };

    db.addQuotation(newQuote);
    reloadData();
    setIsNewQuoteOpen(false);
    setSelectedItems([]);
    setCustName('');
    setCustPhone('');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quotations Management</h2>
            <p className="text-xs text-slate-500">
              Customer estimates, auto-expiry tracking, and conversion to Merchant or Final Sales.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsNewQuoteOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quotation</span>
          </button>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="p-3.5 font-bold">Quote #</th>
                <th className="p-3.5 font-bold">Customer</th>
                <th className="p-3.5 font-bold">Total Estimate</th>
                <th className="p-3.5 font-bold">Prepared By</th>
                <th className="p-3.5 font-bold">Valid Until</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No quotations found. Click "Create Quotation" or save from POS cart.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{q.quoteNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{q.customerName}</div>
                      <div className="text-[10px] text-slate-400">{q.customerPhone || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {org.currency} {q.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {q.attendantFirstName} ({q.staffId})
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">{q.validUntil}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          q.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.status === 'converted_merchant' || q.status === 'converted_sale'
                            ? 'bg-blue-100 text-blue-800'
                            : q.status === 'expired'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="uppercase">{q.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedQuote(q)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>

                      {q.status === 'active' && (
                        <button
                          onClick={() => handleConvertToMerchant(q)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                        >
                          <span>To Merchant</span>
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

      {/* Details Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Quotation #{selectedQuote.quoteNumber}
                </h3>
                <p className="text-xs text-slate-500">Customer: {selectedQuote.customerName}</p>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Valid Until:</span>
                <span className="font-mono font-bold text-slate-800">{selectedQuote.validUntil}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Prepared By:</span>
                <span>{selectedQuote.attendantFirstName} (ID: {selectedQuote.staffId})</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t pt-3 space-y-1.5 max-h-48 overflow-y-auto text-xs">
              {selectedQuote.items.map((it, idx) => (
                <div key={idx} className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-slate-900">{it.product.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {it.quantity} x {org.currency} {it.unitPrice.toLocaleString()}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    {org.currency} {it.total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 flex items-center justify-between">
              <div className="text-base font-extrabold text-slate-900 font-mono">
                Total: {org.currency} {selectedQuote.totalAmount.toLocaleString()}
              </div>
              {selectedQuote.status === 'active' && (
                <button
                  onClick={() => handleConvertToMerchant(selectedQuote)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Convert to Merchant Sale</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create New Quotation Modal */}
      {isNewQuoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateQuote}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Generate Quotation Estimate</h3>
              <button
                type="button"
                onClick={() => setIsNewQuoteOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Apex Builders"
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Select Hardware Products to Include:
              </label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                {products.slice(0, 6).map((p) => {
                  const existing = selectedItems.find((s) => s.product.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {org.currency} {p.sellingPrice.toLocaleString()} / {p.unit}
                        </div>
                      </div>
                      {existing ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{existing.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedItems((prev) => prev.filter((s) => s.product.id !== p.id))
                            }
                            className="text-rose-600 text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedItems((prev) => [...prev, { product: p, quantity: 1 }])
                          }
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-bold text-[10px]"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t">
              <span className="text-slate-500 font-semibold">
                Selected: {selectedItems.length} items
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
              >
                Save Quotation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
