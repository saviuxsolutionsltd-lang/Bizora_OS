import { Sale, Organization } from '../types';

export function formatThermalReceiptContent(sale: Sale, org: Organization, size: '80mm' | '58mm' = '80mm'): string {
  const lineCharCount = size === '80mm' ? 44 : 32;
  const divider = '-'.repeat(lineCharCount);
  const doubleDivider = '='.repeat(lineCharCount);

  let output = '';
  output += `${org.name}\n`;
  output += `${org.tradingName}\n`;
  output += `${org.branchName}\n`;
  output += `${org.address}\n`;
  output += `TEL: ${org.phone}\n`;
  output += `KRA PIN: ${org.kraPin}\n`;
  output += `CIU SERIES: ${sale.ciuSeries}\n`;
  output += `CU NUMBER: ${sale.cuNumber}\n`;
  output += `${doubleDivider}\n`;
  output += `TAX INVOICE / ETR RECEIPT\n`;
  output += `RECEIPT NO: ${sale.receiptNumber}\n`;
  output += `ORDER NO:   ${sale.orderNumber}\n`;
  output += `DATE/TIME:  ${new Date(sale.createdAt).toLocaleString()}\n`;
  output += `TILL:       ${sale.tillName} (${sale.tillId})\n`;
  output += `SERVED BY:  ${sale.attendantFirstName} [Staff ID: ${sale.staffId}]\n`;
  output += `${divider}\n`;

  // Customer Info
  output += `CUSTOMER:   ${sale.customerName}\n`;
  if (sale.customerPhone) output += `PHONE:      ${sale.customerPhone}\n`;
  if (sale.customerAddress) output += `ADDR:       ${sale.customerAddress}\n`;
  if (sale.customerKraPin) output += `CUST PIN:   ${sale.customerKraPin}\n`;
  output += `${divider}\n`;

  // Item List
  output += `ITEM DESCRIPTION        QTY   PRICE     TOTAL\n`;
  output += `${divider}\n`;

  for (const item of sale.items) {
    let name = item.product.name;
    if (item.selectedPaintBaseId) {
      name += ` (${item.selectedPaintBaseId})`;
    }
    output += `${name}\n`;
    output += `  ${item.quantity} ${item.product.unit} @ ${item.unitPrice.toFixed(2)}  = ${item.total.toFixed(2)} KES\n`;
  }

  output += `${divider}\n`;
  output += `SUBTOTAL (EXCL):       ${sale.subtotal.toFixed(2)} KES\n`;
  output += `VAT (16% INCLUDED):    ${sale.taxAmount.toFixed(2)} KES\n`;
  if (sale.discountTotal > 0) {
    output += `DISCOUNT TOTAL:       -${sale.discountTotal.toFixed(2)} KES\n`;
  }
  output += `TOTAL AMOUNT:          ${sale.totalAmount.toFixed(2)} KES\n`;
  output += `${doubleDivider}\n`;

  // Payment Breakdown
  output += `PAYMENT BREAKDOWN:\n`;
  if (sale.paymentDetails.cashAmount) {
    output += `CASH TENDERED:         ${sale.paymentDetails.cashAmount.toFixed(2)} KES\n`;
  }
  if (sale.paymentDetails.mpesaAmount) {
    output += `M-PESA (${sale.paymentDetails.mpesaReference || 'CONFIRMED'}): ${sale.paymentDetails.mpesaAmount.toFixed(2)} KES\n`;
  }
  if (sale.paymentDetails.walletAmount) {
    output += `CUSTOMER WALLET:       ${sale.paymentDetails.walletAmount.toFixed(2)} KES\n`;
  }
  if (sale.paymentDetails.cardAmount) {
    output += `CARD (${sale.paymentDetails.cardReference || 'VISA/MC'}): ${sale.paymentDetails.cardAmount.toFixed(2)} KES\n`;
  }
  output += `${divider}\n`;

  // Footer & CIU Verification
  output += `SIGNATURE VERIFICATION CODE:\n`;
  output += `KRA-${sale.cuNumber.slice(-8)}-${Date.now().toString().slice(-6)}\n`;
  output += `Scan QR code or verify at itax.kra.go.ke\n`;
  output += `${divider}\n`;
  output += `${org.receiptFooter}\n`;

  return output;
}
