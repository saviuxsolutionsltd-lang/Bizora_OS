import React, { useState } from 'react';
import { Sale, Organization, Till, User } from '../types';
import { db } from '../services/db';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  Eye,
  Calendar,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface FinalSalesScreenProps {
  org: Organization;
  onOpenReceipt: (sale: Sale) => void;
}

export const FinalSalesScreen: React.FC<FinalSalesScreenProps> = ({ org, onOpenReceipt }) => {
  const [sales, setSales] = useState<Sale[]>(() => db.getSales());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleForAudit, setSelectedSaleForAudit] = useState<Sale | null>(null);

  const reloadData = () => {
    setSales(db.getSales());
  };

  const filteredSales = sales.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.orderNumber.toLowerCase().includes(term) ||
      s.receiptNumber.toLowerCase().includes(term) ||
      (s.cuNumber && s.cuNumber.toLowerCase().includes(term)) ||
      s.customerName.toLowerCase().includes(term) ||
      s.attendantFirstName.toLowerCase().includes(term)
    );
  });

  const handleProcessRefund = (sale: Sale) => {
    const reason = prompt(`Reason for refunding ETR #${sale.receiptNumber}:`, 'Customer return within 48 hours');
    if (!reason) return;

    // Increment inventory back
    const products = db.getProducts();
    sale.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.product.id);
      if (prod) {
        prod.stockQuantity += item.quantity;
      }
    });
    db.saveProducts(products);

    // Update sale status
    const allSales = db.getSales();
    const idx = allSales.findIndex((s) => s.id === sale.id);
    if (idx >= 0) {
      allSales[idx].status = 'refunded';
      allSales[idx].auditTimeline.push({
        title: 'Goods Returned & Refund Credit Note Issued',
        description: `Reason: ${reason}. Restocked ${sale.items.length} product lines.`,
        timestamp: new Date().toISOString(),
        actor: 'Attendant',
        stage: 'return',
      });
      db.saveSales(allSales);
    }

    db.addAuditLog({
      id: `AUD-REFUND-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SALE_REFUNDED_RESTOCKED',
      module: 'SALES_RETURN',
      staffId: sale.staffId,
      staffName: sale.attendantFirstName,
      tillId: sale.tillId,
      details: `Refunded sale ${sale.orderNumber} (ETR: ${sale.receiptNumber}). Restocked items.`,
      severity: 'warning',
      ipOrDevice: sale.tillName,
    });

    reloadData();
    alert(`Refund processed! Credit note logged and inventory items safely returned to stock.`);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Final Sales & eTIMS ETR Invoices</h2>
            <p className="text-xs text-slate-500">
              Fiscalized transactions, thermal receipts, returns processing, and complete lifecycle audit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by receipt #, CU #, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="p-3.5 font-bold">Receipt # / ETR</th>
                <th className="p-3.5 font-bold">eTIMS CU Number</th>
                <th className="p-3.5 font-bold">Customer</th>
                <th className="p-3.5 font-bold">Payment Mode</th>
                <th className="p-3.5 font-bold">Total Amount</th>
                <th className="p-3.5 font-bold">Attendant & Till</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No final sales recorded yet. Complete a checkout in the POS Terminal.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">
                      <div>{sale.receiptNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-700">
                      {sale.cuNumber || 'CIU-PENDING'}
                    </td>
                    <td className="p-3.5 font-medium text-slate-900">
                      <div>{sale.customerName}</div>
                      {sale.customerKraPin && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          PIN: {sale.customerKraPin}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 uppercase font-bold text-[10px] text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {org.currency} {sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div>{sale.attendantFirstName} (ID: {sale.staffId})</div>
                      <div className="text-[10px] text-slate-400">{sale.tillName}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          sale.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.status === 'refunded'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="uppercase">{sale.status}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedSaleForAudit(sale)}
                        title="View Full Cycle Audit Stepper"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Cycle</span>
                      </button>

                      <button
                        onClick={() => onOpenReceipt(sale)}
                        title="Print Thermal Receipt (80mm / 58mm)"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>

                      {sale.status === 'completed' && (
                        <button
                          onClick={() => handleProcessRefund(sale)}
                          title="Process Customer Return / Refund"
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Return</span>
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

      {/* Full Cycle Stepper Modal */}
      {selectedSaleForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Full Order Cycle Audit • ETR #{selectedSaleForAudit.receiptNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: {selectedSaleForAudit.customerName} • CU: {selectedSaleForAudit.cuNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedSaleForAudit(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Stepper */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">
                Lifecycle Progression History
              </h4>
              <div className="space-y-3 border-l-2 border-blue-600 pl-3.5 ml-2 text-xs">
                {selectedSaleForAudit.auditTimeline && selectedSaleForAudit.auditTimeline.map((ev, i) => (
                  <div key={i} className="relative pb-2">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                    <div className="font-bold text-slate-900">{ev.title}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{ev.description}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(ev.timestamp).toLocaleString()} • Actor: {ev.actor}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items table */}
            <div className="border-t pt-3 space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-700 uppercase mb-1">Purchased Products</h4>
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {selectedSaleForAudit.items.map((it, idx) => (
                  <div key={idx} className="p-2 flex justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{it.product.name}</div>
                      {it.selectedPaintBaseId && (
                        <div className="text-[10px] text-purple-700">Base: {it.selectedPaintBaseId}</div>
                      )}
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
            </div>

            <div className="border-t pt-3 flex items-center justify-between">
              <div className="text-sm font-extrabold text-slate-900 font-mono">
                Total Paid: {org.currency} {selectedSaleForAudit.totalAmount.toLocaleString()}
              </div>
              <button
                onClick={() => {
                  setSelectedSaleForAudit(null);
                  onOpenReceipt(selectedSaleForAudit);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
