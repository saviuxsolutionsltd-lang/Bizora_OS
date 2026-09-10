import React, { useState } from 'react';
import { Customer, Organization, Sale, MerchantSale, Quotation } from '../types';
import { db } from '../services/db';
import {
  Users,
  Search,
  Plus,
  Wallet,
  Phone,
  MapPin,
  Eye,
  CreditCard,
  Building,
  CheckCircle2,
  FileText,
  Receipt,
  FileCheck2,
} from 'lucide-react';

interface CustomersScreenProps {
  customers: Customer[];
  org: Organization;
  onReloadCustomers: () => void;
  onViewReceipt: (sale: Sale) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  org,
  onReloadCustomers,
  onViewReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Top-up modal
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('5000');
  const [topUpMethod, setTopUpMethod] = useState<'cash' | 'mpesa'>('mpesa');

  // New Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [creditLimit, setCreditLimit] = useState('50000');

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.kraPin && c.kraPin.toLowerCase().includes(term))
    );
  });

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCustomer: Customer = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      phone: phone.trim() || '+254 700 000 000',
      email: email.trim(),
      address: address.trim() || 'Nairobi, Kenya',
      kraPin: kraPin.trim().toUpperCase(),
      walletBalance: 0,
      creditLimit: parseFloat(creditLimit) || 50000,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
    };

    const currentList = db.getCustomers();
    currentList.unshift(newCustomer);
    db.saveCustomers(currentList);
    onReloadCustomers();
    setIsAddOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setKraPin('');
  };

  const handleTopUpWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amount = parseFloat(topUpAmount) || 0;
    if (amount <= 0) return;

    const list = db.getCustomers();
    const idx = list.findIndex((c) => c.id === selectedCustomer.id);
    if (idx >= 0) {
      list[idx].walletBalance += amount;
      db.saveCustomers(list);

      db.addAuditLog({
        id: `AUD-WALLET-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'CUSTOMER_WALLET_CREDITED',
        module: 'CUSTOMERS',
        staffId: '1001',
        staffName: 'Cashier',
        tillId: 'TILL-01',
        details: `Credited KES ${amount.toLocaleString()} to wallet of ${selectedCustomer.name} via ${topUpMethod.toUpperCase()}.`,
        severity: 'info',
        ipOrDevice: 'POS Counter',
      });

      setSelectedCustomer(list[idx]);
      onReloadCustomers();
      setIsTopUpOpen(false);
      alert(`Successfully credited KES ${amount.toLocaleString()} to ${selectedCustomer.name}'s wallet!`);
    }
  };

  // Find customer's transaction cycle history
  const customerQuotes: Quotation[] = selectedCustomer
    ? db.getQuotations().filter((q) => q.customerId === selectedCustomer.id || q.customerName === selectedCustomer.name)
    : [];

  const customerMerchantSales: MerchantSale[] = selectedCustomer
    ? db.getMerchantSales().filter((ms) => ms.customerId === selectedCustomer.id || ms.customerName === selectedCustomer.name)
    : [];

  const customerFinalSales: Sale[] = selectedCustomer
    ? db.getSales().filter((s) => s.customerId === selectedCustomer.id || s.customerName === selectedCustomer.name)
    : [];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Customers & Digital Wallets</h2>
            <p className="text-xs text-slate-500">
              Contractors, accounts, KRA PIN records, prepaid wallet balances, and full order cycle audit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, phone, KRA PIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customers Cards / Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">{cust.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{cust.phone}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Wallet</span>
                  <span className="text-sm font-mono font-bold text-emerald-700">
                    {org.currency} {cust.walletBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-xs text-slate-600 border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">KRA PIN:</span>
                  <span className="font-mono font-bold text-slate-800">{cust.kraPin || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Credit Limit:</span>
                  <span className="font-mono text-slate-700">
                    {org.currency} {cust.creditLimit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Address:</span>
                  <span className="truncate max-w-[160px]">{cust.address}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(cust);
                  setIsTopUpOpen(true);
                }}
                className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Deposit Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCustomer(cust)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Full Cycle</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Full Cycle Details Modal */}
      {selectedCustomer && !isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-slate-500 font-mono">
                  KRA PIN: {selectedCustomer.kraPin || 'N/A'} • Phone: {selectedCustomer.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close
              </button>
            </div>

            {/* Balances Card */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">PREPAID WALLET BALANCE</span>
                <span className="text-base font-mono font-extrabold text-emerald-700">
                  {org.currency} {selectedCustomer.walletBalance.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">APPROVED CREDIT LIMIT</span>
                <span className="text-base font-mono font-bold text-slate-800">
                  {org.currency} {selectedCustomer.creditLimit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Complete Transaction Lifecycle Cycles (Quotations -> Merchant Sales -> Final Sales) */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                Complete Customer Order Cycles
              </h4>

              {/* 1. Final ETR Sales */}
              <div>
                <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1 text-[11px]">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  <span>Final ETR Sales & Receipts ({customerFinalSales.length})</span>
                </div>
                {customerFinalSales.length === 0 ? (
                  <div className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded">
                    No final sales recorded for this customer.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-28 overflow-y-auto border rounded-lg divide-y">
                    {customerFinalSales.map((s) => (
                      <div key={s.id} className="p-2 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-mono font-bold text-blue-700">ETR #{s.receiptNumber}</span>
                          <span className="text-[10px] text-slate-500 ml-2">
                            {new Date(s.createdAt).toLocaleDateString()} ({s.paymentMethod.toUpperCase()})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">
                            {org.currency} {s.totalAmount.toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedCustomer(null);
                              onViewReceipt(s);
                            }}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold text-[10px]"
                          >
                            Print Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Merchant Sales */}
              <div>
                <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1 text-[11px]">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Merchant Sales & Proforma Accounts ({customerMerchantSales.length})</span>
                </div>
                {customerMerchantSales.length === 0 ? (
                  <div className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded">
                    No merchant proforma sales on record.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-24 overflow-y-auto border rounded-lg divide-y">
                    {customerMerchantSales.map((ms) => (
                      <div key={ms.id} className="p-2 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-mono font-bold text-indigo-700">Order #{ms.merchantOrderNumber}</span>
                          <span className="text-[10px] text-slate-500 ml-2">
                            {new Date(ms.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">
                            {org.currency} {ms.totalAmount.toLocaleString()}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800">
                            {ms.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Quotations */}
              <div>
                <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1 text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Quotations & Estimates ({customerQuotes.length})</span>
                </div>
                {customerQuotes.length === 0 ? (
                  <div className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded">
                    No quotations generated for this customer.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-24 overflow-y-auto border rounded-lg divide-y">
                    {customerQuotes.map((q) => (
                      <div key={q.id} className="p-2 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-mono font-bold text-amber-700">Quote #{q.quoteNumber}</span>
                          <span className="text-[10px] text-slate-500 ml-2">Valid until: {q.validUntil}</span>
                        </div>
                        <span className="font-mono font-bold">
                          {org.currency} {q.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit / Wallet Top-Up Modal */}
      {isTopUpOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleTopUpWallet}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Deposit Customer Wallet</h3>
              <button
                type="button"
                onClick={() => setIsTopUpOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                Close
              </button>
            </div>

            <div>
              <span className="text-slate-500 block">Customer:</span>
              <span className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Current Wallet: KES {selectedCustomer.walletBalance.toLocaleString()}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Top-Up Amount (KES) *
              </label>
              <input
                type="number"
                required
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTopUpMethod('mpesa')}
                  className={`py-2 rounded-xl font-bold border text-center transition ${
                    topUpMethod === 'mpesa'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Daraja M-Pesa
                </button>
                <button
                  type="button"
                  onClick={() => setTopUpMethod('cash')}
                  className={`py-2 rounded-xl font-bold border text-center transition ${
                    topUpMethod === 'cash'
                      ? 'bg-blue-50 text-blue-800 border-blue-500 ring-2 ring-blue-500'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Counter Cash
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t">
              <button
                type="button"
                onClick={() => setIsTopUpOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
              >
                Confirm Deposit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleAddCustomer}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Register New Customer</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                Close
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Customer / Contractor Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Electricals Ltd"
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">KRA PIN</label>
                <input
                  type="text"
                  value={kraPin}
                  onChange={(e) => setKraPin(e.target.value)}
                  placeholder="P051234567Z"
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@client.co.ke"
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Credit Limit</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Physical / Delivery Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Westlands, Nairobi"
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
              >
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
