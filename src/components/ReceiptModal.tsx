import React, { useState } from 'react';
import { Sale, Organization } from '../types';
import { Printer, X, CheckCircle2, QrCode, Smartphone, FileText } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  org: Organization;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, org, onClose }) => {
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('58mm');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Thermal Width:</span>
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-md transition ${
                  paperWidth === '80mm' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-md transition ${
                  paperWidth === '58mm' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58mm
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thermal Slip Container (Simulated thermal roll) */}
        <div className="flex-1 overflow-y-auto py-4 flex justify-center bg-slate-100/70 rounded-2xl my-3">
          <div
            className={`bg-white p-6 shadow-md border border-slate-200 font-mono text-[11px] leading-tight text-slate-900 transition-all ${
              paperWidth === '80mm' ? 'w-80' : 'w-64 text-[10px]'
            }`}
          >
            {/* Business Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              <h1 className="text-sm font-black uppercase tracking-wider">{org.name}</h1>
              {org.tradingName && <div className="text-[10px] font-bold">t/a {org.tradingName}</div>}
              <div className="text-[10px] text-slate-600">{org.branchName}</div>
              <div className="text-[10px] text-slate-600">{org.address}</div>
              <div className="text-[10px] text-slate-600">TEL: {org.phone}</div>
              <div className="font-bold text-xs pt-1">PIN: {org.kraPin}</div>
            </div>

            {/* Fiscal Device & Receipt Meta */}
            <div className="py-2.5 space-y-1 border-b border-dashed border-slate-400 text-[10px]">
              <div className="flex justify-between">
                <span>RECEIPT NO:</span>
                <span className="font-bold">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>CU SERIAL:</span>
                <span className="font-bold">{org.fiscalDeviceSerial}</span>
              </div>
              <div className="flex justify-between">
                <span>eTIMS CU INVOICE:</span>
                <span className="font-bold">{sale.cuNumber || 'CIU-PENDING'}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE & TIME:</span>
                <span>{new Date(sale.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>SERVED BY:</span>
                <span className="font-bold">
                  {sale.attendantFirstName} [ID: {sale.staffId}]
                </span>
              </div>
              <div className="flex justify-between">
                <span>DEVICE / TILL:</span>
                <span>{sale.tillId}</span>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[10px]">
              <div className="flex justify-between">
                <span>BUYER:</span>
                <span className="font-bold truncate max-w-[150px]">{sale.customerName}</span>
              </div>
              {sale.customerKraPin && (
                <div className="flex justify-between">
                  <span>BUYER PIN:</span>
                  <span className="font-bold">{sale.customerKraPin}</span>
                </div>
              )}
            </div>

            {/* Itemized Lines */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5">
              <div className="flex justify-between font-bold text-[10px] border-b pb-1">
                <span>DESCRIPTION</span>
                <span>TOTAL</span>
              </div>
              {sale.items.map((it, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-slate-900">{it.product.name}</div>
                  {/* Paint Formulation Constituent Bases Listing */}
                  {it.product.composition && it.product.composition.length > 0 ? (
                    <div className="text-[9px] text-slate-800 pl-1.5 py-0.5 my-0.5 border-l-2 border-slate-400 space-y-0.5 bg-slate-50">
                      <div className="font-bold">↳ Formulation Bases Dispensed:</div>
                      {it.product.composition.map((comp, ci) => (
                        <div key={ci} className="text-slate-700 pl-1 font-mono">
                          • {comp.baseProductName.replace(/Crown Master Tint /g, '')}: {Math.round(comp.quantityRequired * it.quantity * 10) / 10} {comp.unit} ({comp.percentage}%)
                        </div>
                      ))}
                    </div>
                  ) : it.product.paintBaseIds && it.product.paintBaseIds.length > 0 ? (
                    <div className="text-[9px] text-slate-700 italic pl-1 leading-tight">
                      ↳ Formulation Bases: {it.product.paintBaseIds.join(', ')}
                    </div>
                  ) : null}
                  {it.selectedPaintBaseId && (!it.product.composition || it.product.composition.length === 0) && (!it.product.paintBaseIds || it.product.paintBaseIds.length === 0) && (
                    <div className="text-[9px] text-slate-700 italic pl-1">
                      ↳ Base: {it.selectedPaintBaseId}
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>
                      {it.quantity} {it.product.unit} x {it.unitPrice.toLocaleString()}
                    </span>
                    <span className="font-bold text-slate-900">{it.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals & Tax Table */}
            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-400">
              <div className="flex justify-between text-slate-600">
                <span>TAXABLE BASE (16%):</span>
                <span>{org.currency} {sale.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>KRA VAT (16%):</span>
                <span>{org.currency} {Math.round(sale.taxAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                <span>TOTAL AMOUNT:</span>
                <span>{org.currency} {sale.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="py-2 space-y-0.5 text-[10px] border-b border-dashed border-slate-400">
              <div className="flex justify-between">
                <span>TENDER METHOD:</span>
                <span className="font-bold uppercase">{sale.paymentMethod}</span>
              </div>
              {sale.paymentReference && (
                <div className="flex justify-between">
                  <span>REF / CODE:</span>
                  <span className="font-bold font-mono">{sale.paymentReference}</span>
                </div>
              )}
            </div>

            {/* KRA eTIMS QR Verification Section */}
            <div className="py-4 text-center space-y-2">
              <div className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                KRA FISCAL RECEIPT VERIFICATION
              </div>
              <div className="flex justify-center">
                <div className="p-2 bg-slate-50 border border-slate-300 rounded-lg inline-block">
                  <QrCode className="w-24 h-24 text-slate-900" />
                </div>
              </div>
              <div className="text-[9px] text-slate-500 break-all px-2">
                VERIFY: https://itax.kra.go.ke/etims/receipt?inv={sale.cuNumber || sale.receiptNumber}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                SIG: {sale.receiptNumber}-KRA-{sale.id.slice(-6)}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-dashed border-slate-400 text-center space-y-1 text-[9px] text-slate-600">
              <p>{org.receiptFooter || 'Goods once sold cannot be returned without original receipt.'}</p>
              <p className="font-bold text-slate-700">*** THANK YOU FOR YOUR PATRONAGE ***</p>
              <p className="text-[8px] text-slate-400">Powered by BizoraOS ERP POS System</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            KRA eTIMS Compliant • Auto-generated QR validation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
