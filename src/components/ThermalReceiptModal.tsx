import React, { useState } from 'react';
import { Sale, Organization } from '../types';
import { formatThermalReceiptContent } from '../services/receipt';
import { Printer, X, Download, Copy, Check, QrCode, Smartphone } from 'lucide-react';

interface ThermalReceiptModalProps {
  sale: Sale | null;
  org: Organization;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  sale,
  org,
  isOpen,
  onClose,
}) => {
  const [receiptSize, setReceiptSize] = useState<'80mm' | '58mm'>('80mm');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !sale) return null;

  const receiptRawText = formatThermalReceiptContent(sale, org, receiptSize);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptRawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thermal Receipt & ETR Invoice</h3>
              <p className="text-xs text-slate-500">eTIMS CIU Series: {sale.ciuSeries}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Controls */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <span>Size:</span>
            <button
              onClick={() => setReceiptSize('80mm')}
              className={`px-2.5 py-1 rounded-md transition ${
                receiptSize === '80mm'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              80mm (Standard)
            </button>
            <button
              onClick={() => setReceiptSize('58mm')}
              className={`px-2.5 py-1 rounded-md transition ${
                receiptSize === '58mm'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              58mm (Compact)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-200 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Receipt Visual Paper Render Container */}
        <div className="p-6 bg-slate-200/60 flex justify-center max-h-[60vh] overflow-y-auto">
          <div
            id="thermal-receipt-print-area"
            className={`bg-white shadow-md p-6 font-mono text-slate-900 border border-slate-300 text-xs transition-all ${
              receiptSize === '80mm' ? 'w-[340px]' : 'w-[260px]'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace, Courier" }}
          >
            {/* Header branding */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <div className="font-bold text-sm tracking-wider uppercase">{org.name}</div>
              <div className="text-[11px] text-slate-700">{org.tradingName}</div>
              <div className="text-[10px] text-slate-600">{org.branchName}</div>
              <div className="text-[10px] text-slate-600">{org.address}</div>
              <div className="text-[10px] text-slate-700">TEL: {org.phone}</div>
              <div className="text-[10px] font-bold text-slate-800 mt-1">KRA PIN: {org.kraPin}</div>
            </div>

            {/* Fiscal eTIMS & Till Info */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="font-bold text-center text-xs py-0.5 bg-slate-100 rounded my-1">
                TAX INVOICE / ETR RECEIPT
              </div>
              <div className="flex justify-between">
                <span>RECEIPT NO:</span>
                <span className="font-bold">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>ORDER REF:</span>
                <span>{sale.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE/TIME:</span>
                <span>{new Date(sale.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>TILL:</span>
                <span className="font-bold">{sale.tillName}</span>
              </div>
              <div className="flex justify-between text-blue-900 bg-blue-50/70 px-1 rounded">
                <span>SERVED BY:</span>
                <span className="font-bold">
                  {sale.attendantFirstName} (ID: {sale.staffId})
                </span>
              </div>
            </div>

            {/* Customer Details & PIN */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5 bg-slate-50 p-1.5 rounded my-1.5">
              <div className="flex justify-between">
                <span className="font-semibold">CUSTOMER:</span>
                <span className="font-bold">{sale.customerName}</span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span>PHONE:</span>
                  <span>{sale.customerPhone}</span>
                </div>
              )}
              {sale.customerAddress && (
                <div className="flex justify-between">
                  <span>ADDRESS:</span>
                  <span>{sale.customerAddress}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-emerald-900">
                <span>KRA PIN:</span>
                <span>{sale.customerKraPin || 'NOT SPECIFIED (EXEMPT)'}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-200 pb-0.5">
                <span>DESCRIPTION</span>
                <span>QTY x PRICE = TOTAL</span>
              </div>
              <div className="space-y-1.5">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="text-[11px] leading-tight">
                    <div className="font-bold text-slate-900">
                      {item.product.name}
                      {item.selectedPaintBaseId && (
                        <span className="text-purple-700 text-[10px] block">
                          └ Tint Base: {item.selectedPaintBaseId}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>
                        {item.quantity} {item.product.unit} @ {item.unitPrice.toLocaleString()} KES
                      </span>
                      <span className="font-bold text-slate-900">{item.total.toLocaleString()} KES</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Net):</span>
                <span>{sale.subtotal.toLocaleString()} KES</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT 16% (Tax Included):</span>
                <span>{sale.taxAmount.toLocaleString()} KES</span>
              </div>
              {sale.discountTotal > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount Total:</span>
                  <span>-{sale.discountTotal.toLocaleString()} KES</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL AMOUNT:</span>
                <span>{sale.totalAmount.toLocaleString()} KES</span>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
              <div className="font-bold text-slate-700">PAYMENT DETAILS:</div>
              {sale.paymentDetails.cashAmount && (
                <div className="flex justify-between">
                  <span>Cash Paid:</span>
                  <span>{sale.paymentDetails.cashAmount.toLocaleString()} KES</span>
                </div>
              )}
              {sale.paymentDetails.mpesaAmount && (
                <div className="flex justify-between font-semibold text-emerald-800">
                  <span>M-Pesa ({sale.paymentDetails.mpesaReference || 'OK'}):</span>
                  <span>{sale.paymentDetails.mpesaAmount.toLocaleString()} KES</span>
                </div>
              )}
              {sale.paymentDetails.walletAmount && (
                <div className="flex justify-between font-semibold text-blue-800">
                  <span>Customer Wallet:</span>
                  <span>{sale.paymentDetails.walletAmount.toLocaleString()} KES</span>
                </div>
              )}
              {sale.paymentDetails.cardAmount && (
                <div className="flex justify-between">
                  <span>Card ({sale.paymentDetails.cardReference || 'CARD'}):</span>
                  <span>{sale.paymentDetails.cardAmount.toLocaleString()} KES</span>
                </div>
              )}
            </div>

            {/* KRA eTIMS CIU Fiscal Signature & QR Code */}
            <div className="pt-3 text-center space-y-1 text-[10px] text-slate-600">
              <div className="flex justify-center my-1">
                <div className="p-2 border border-slate-300 rounded bg-slate-50 inline-flex flex-col items-center">
                  <QrCode className="w-16 h-16 text-slate-900" />
                  <span className="text-[8px] font-mono mt-0.5">eTIMS VERIFY</span>
                </div>
              </div>
              <div className="font-bold text-[10px] text-slate-800">CU NUMBER: {sale.cuNumber}</div>
              <div className="text-[9px] font-mono text-slate-500 break-all">
                SIG: {sale.ciuSeries.replace(/[^A-Z0-9]/g, '')}-{sale.id.slice(-6).toUpperCase()}
              </div>
              <div className="text-[9px] text-slate-500">
                Goods once sold are returnable within 48 hours in original condition.
              </div>
              <div className="text-[9px] font-semibold text-slate-700 mt-2">
                Thank you for your business! Powered by BizoraOS ERP POS
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Ready for Bluetooth / USB Thermal Print</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Quick Print (Thermal)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
