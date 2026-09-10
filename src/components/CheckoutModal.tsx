import React, { useState } from 'react';
import { CartItem, Customer, Organization, Till, User, Sale, MerchantSale } from '../types';
import { db } from '../services/db';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Search,
  Receipt,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountTotal: number;
  totalAmount: number;
  customers: Customer[];
  currentTill: Till;
  currentUser: User;
  org: Organization;
  onSuccessSale: (sale: Sale) => void;
  onSuccessMerchantSale: (merchantSale: MerchantSale) => void;
  onReloadCustomers: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  taxAmount,
  discountTotal,
  totalAmount,
  customers,
  currentTill,
  currentUser,
  org,
  onSuccessSale,
  onSuccessMerchantSale,
  onReloadCustomers,
}) => {
  const [paymentType, setPaymentType] = useState<'cash' | 'mpesa' | 'card' | 'wallet' | 'split'>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustKraPin, setNewCustKraPin] = useState('');

  // Payment inputs
  const [cashTendered, setCashTendered] = useState<string>(totalAmount.toString());
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'pushing' | 'confirmed'>('idle');
  const [mpesaRefCode, setMpesaRefCode] = useState('');
  const [cardRef, setCardRef] = useState('VISA-9941');

  // Split amounts
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitMpesa, setSplitMpesa] = useState<number>(totalAmount);
  const [splitWallet, setSplitWallet] = useState<number>(0);

  const [orderNotes, setOrderNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleMode, setSaleMode] = useState<'final_etr' | 'merchant_sale'>('final_etr');

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      (c.kraPin && c.kraPin.toLowerCase().includes(customerSearch.toLowerCase())),
  );

  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCustomer: Customer = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '+254 700 000 000',
      email: '',
      address: newCustAddress.trim() || 'Nairobi, Kenya',
      kraPin: newCustKraPin.trim().toUpperCase(),
      walletBalance: 0,
      creditLimit: 50000,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
    };

    const currentCusts = db.getCustomers();
    currentCusts.unshift(newCustomer);
    db.saveCustomers(currentCusts);
    onReloadCustomers();
    setSelectedCustomerId(newCustomer.id);
    setIsAddingNewCustomer(false);
  };

  const handleSimulateDarajaStkPush = () => {
    setMpesaStatus('pushing');
    setTimeout(() => {
      const randomCode = 'Q' + Math.random().toString(36).substring(2, 8).toUpperCase() + 'K';
      setMpesaRefCode(randomCode);
      setMpesaStatus('confirmed');
    }, 1800);
  };

  const handleCompleteTransaction = () => {
    setIsProcessing(true);

    const custName = selectedCustomer ? selectedCustomer.name : 'Walk-in Customer';
    const custPhone = selectedCustomer ? selectedCustomer.phone : '';
    const custAddress = selectedCustomer ? selectedCustomer.address : '';
    const custPin = selectedCustomer ? selectedCustomer.kraPin : '';

    const timestamp = new Date().toISOString();
    const sequence = Math.floor(1000 + Math.random() * 9000);

    if (saleMode === 'merchant_sale') {
      // Create Merchant Sale (sale_audit)
      const merchantOrderNumber = `MS-${Date.now().toString().slice(-6)}`;
      const merchantSale: MerchantSale = {
        id: `MSALE-${Date.now()}`,
        merchantOrderNumber,
        customerId: selectedCustomer ? selectedCustomer.id : 'WALK-IN',
        customerName: custName,
        customerPhone: custPhone,
        customerAddress: custAddress,
        customerKraPin: custPin,
        items: cartItems,
        subtotal,
        totalAmount,
        status: 'pending',
        tillId: currentTill.id,
        tillName: currentTill.name,
        staffId: currentUser.staffId,
        attendantFirstName: currentUser.firstName,
        createdAt: timestamp,
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        notes: orderNotes,
        auditTimeline: [
          {
            title: 'Merchant Sale Created',
            description: `Drafted by ${currentUser.firstName} (Staff ID ${currentUser.staffId}) on ${currentTill.name}`,
            timestamp,
            actor: currentUser.firstName,
            stage: 'merchant',
          },
        ],
      };

      db.addMerchantSale(merchantSale);
      setIsProcessing(false);
      onSuccessMerchantSale(merchantSale);
      onClose();
      return;
    }

    // Final Sale with ETR & CIU
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const receiptNumber = `ETR-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cuNumber = `${org.etimsCiuSeries}${dateStr}-${sequence}`;

    let paymentDetails: Sale['paymentDetails'] = {};

    if (paymentType === 'cash') {
      paymentDetails.cashAmount = parseFloat(cashTendered) || totalAmount;
    } else if (paymentType === 'mpesa') {
      paymentDetails.mpesaAmount = totalAmount;
      paymentDetails.mpesaReference = mpesaRefCode || 'QKD992L1P';
    } else if (paymentType === 'wallet') {
      paymentDetails.walletAmount = totalAmount;
    } else if (paymentType === 'card') {
      paymentDetails.cardAmount = totalAmount;
      paymentDetails.cardReference = cardRef;
    } else if (paymentType === 'split') {
      paymentDetails.cashAmount = splitCash;
      paymentDetails.mpesaAmount = splitMpesa;
      paymentDetails.walletAmount = splitWallet;
      paymentDetails.mpesaReference = mpesaRefCode || 'SPLIT-OK';
    }

    const sale: Sale = {
      id: `SALE-${Date.now()}`,
      orderNumber,
      receiptNumber,
      cuNumber,
      ciuSeries: org.etimsCiuSeries,
      customerId: selectedCustomer?.id,
      customerName: custName,
      customerPhone: custPhone,
      customerAddress: custAddress,
      customerKraPin: custPin,
      items: cartItems,
      subtotal,
      taxAmount,
      discountTotal,
      totalAmount,
      paymentMethod: paymentType,
      paymentDetails,
      paymentStatus: 'paid',
      tillId: currentTill.id,
      tillName: currentTill.name,
      staffId: currentUser.staffId,
      attendantFirstName: currentUser.firstName,
      createdAt: timestamp,
      status: 'completed',
      auditTimeline: [
        {
          title: 'Final Sale & ETR Invoice Issued',
          description: `Processed by ${currentUser.firstName} [ID: ${currentUser.staffId}] on ${currentTill.name}. eTIMS CU: ${cuNumber}`,
          timestamp,
          actor: currentUser.firstName,
          stage: 'sale',
        },
      ],
    };

    db.addSale(sale);
    setIsProcessing(false);
    onSuccessSale(sale);
    onClose();
  };

  const cashChange = (parseFloat(cashTendered) || 0) - totalAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Checkout & Payment Processing</h3>
              <p className="text-xs text-slate-500">
                Till: <strong className="text-slate-700">{currentTill.name}</strong> • Attendant:{' '}
                <strong className="text-blue-700">{currentUser.firstName}</strong> (ID: {currentUser.staffId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector: Final ETR Sale vs Merchant Proforma Sale */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Document Type:</span>
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setSaleMode('final_etr')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  saleMode === 'final_etr'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Final Sale (ETR / CIU)
              </button>
              <button
                type="button"
                onClick={() => setSaleMode('merchant_sale')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  saleMode === 'merchant_sale'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Merchant Sale (Proforma / Credit)
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">Payable Total:</span>
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              {org.currency} {totalAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Customer Selection Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Customer & eTIMS KRA PIN
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAddingNewCustomer ? 'Select Existing' : 'New Customer'}</span>
              </button>
            </div>

            {isAddingNewCustomer ? (
              <form onSubmit={handleCreateNewCustomer} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer / Company Name *"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number (e.g. 0712345678)"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Physical / Delivery Address"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="KRA PIN (e.g. P051234567Z)"
                    value={newCustKraPin}
                    onChange={(e) => setNewCustKraPin(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save & Select Customer
                </button>
              </form>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by customer name, phone, or KRA PIN..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">Walk-in Customer (General Retail)</option>
                  {filteredCustomers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} ({cust.phone}) - PIN: {cust.kraPin || 'N/A'} - Wallet: KES{' '}
                      {cust.walletBalance.toLocaleString()}
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{selectedCustomer.name}</div>
                      <div className="text-slate-600 text-[11px]">
                        PIN: <span className="font-mono font-bold text-slate-800">{selectedCustomer.kraPin || 'None'}</span> • Phone: {selectedCustomer.phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Wallet Balance</div>
                      <div className="text-xs font-bold text-emerald-700 font-mono">
                        KES {selectedCustomer.walletBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Method Selector (Only required for Final Sale) */}
          {saleMode === 'final_etr' ? (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Select Payment Method
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote, color: 'emerald' },
                  { id: 'mpesa', label: 'Daraja M-Pesa', icon: Smartphone, color: 'green' },
                  { id: 'wallet', label: 'Customer Wallet', icon: Wallet, color: 'blue' },
                  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, color: 'indigo' },
                  { id: 'split', label: 'Split Payment', icon: FileSpreadsheet, color: 'purple' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentType(item.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="text-xs leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Payment Details Form Panels */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                {paymentType === 'cash' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Cash Amount Tendered:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-500">KES</span>
                        <input
                          type="number"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="w-32 px-2.5 py-1.5 text-sm font-mono font-bold border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                    {cashChange >= 0 ? (
                      <div className="flex justify-between items-center p-2.5 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
                        <span>Change to Return to Customer:</span>
                        <span className="font-mono font-bold text-sm">
                          KES {cashChange.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="text-rose-600 font-semibold">
                        Warning: Tendered amount is less than total by KES {Math.abs(cashChange).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {paymentType === 'mpesa' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Customer M-Pesa Phone:</span>
                      <input
                        type="text"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="07XXXXXXXX"
                        className="w-48 px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleSimulateDarajaStkPush}
                        disabled={mpesaStatus === 'pushing'}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                      >
                        {mpesaStatus === 'pushing' ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5" />
                        )}
                        <span>{mpesaStatus === 'pushing' ? 'Sending STK Push...' : 'Send Daraja STK Push'}</span>
                      </button>

                      {mpesaStatus === 'confirmed' && (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>M-Pesa Ref: {mpesaRefCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {paymentType === 'wallet' && (
                  <div className="space-y-2">
                    {!selectedCustomer ? (
                      <div className="text-amber-700 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>Please select an registered customer with an active wallet above.</span>
                      </div>
                    ) : selectedCustomer.walletBalance < totalAmount ? (
                      <div className="text-rose-600 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          Insufficient wallet balance (Current: KES {selectedCustomer.walletBalance.toLocaleString()}).
                          Need KES {totalAmount.toLocaleString()}.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Wallet Balance Before:</span>
                          <span className="font-mono">KES {selectedCustomer.walletBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-900 border-t border-emerald-200 pt-1">
                          <span>Wallet Balance After Deduction:</span>
                          <span className="font-mono">
                            KES {(selectedCustomer.walletBalance - totalAmount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {paymentType === 'card' && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Card Auth / Slip Reference:</span>
                    <input
                      type="text"
                      value={cardRef}
                      onChange={(e) => setCardRef(e.target.value)}
                      placeholder="e.g. VISA-8812"
                      className="w-48 px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                )}

                {paymentType === 'split' && (
                  <div className="space-y-2">
                    <div className="font-semibold text-slate-700 mb-1">Enter Split Payment Amounts:</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500">Cash (KES)</label>
                        <input
                          type="number"
                          value={splitCash}
                          onChange={(e) => setSplitCash(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500">M-Pesa (KES)</label>
                        <input
                          type="number"
                          value={splitMpesa}
                          onChange={(e) => setSplitMpesa(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500">Wallet (KES)</label>
                        <input
                          type="number"
                          value={splitWallet}
                          onChange={(e) => setSplitWallet(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2 text-xs text-indigo-950">
              <div className="font-bold flex items-center gap-1.5 text-indigo-800">
                <Clock className="w-4 h-4" />
                <span>Merchant Sale (Credit / Proforma Agreement)</span>
              </div>
              <p>
                This sale will be logged in the dedicated <strong>Merchant Sales (sale_audit)</strong> screen.
                Tax and eTIMS ETR will not be triggered until this proforma merchant sale is converted to a final sale.
              </p>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                  Optional Purchase / Project Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Site supply for Kilimani construction phase 2..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* eTIMS CIU & Attendant Security Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>
                eTIMS CIU Series: <strong className="font-mono text-slate-800">{org.etimsCiuSeries}</strong>
              </span>
            </div>
            <div className="text-slate-500 font-mono">
              Attendant: {currentUser.firstName} ({currentUser.staffId})
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleCompleteTransaction}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-white shadow-md transition ${
              saleMode === 'final_etr'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {saleMode === 'final_etr'
                ? `Confirm Sale & Print ETR (KES ${totalAmount.toLocaleString()})`
                : `Save Merchant Sale (KES ${totalAmount.toLocaleString()})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
