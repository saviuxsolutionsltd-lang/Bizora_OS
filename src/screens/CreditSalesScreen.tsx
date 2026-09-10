import React, { useState } from 'react';
import { CreditSale, Customer, Organization, Product, User } from '../types';
import { db } from '../services/db';
import {
  CreditCard,
  Search,
  Plus,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Eye,
  Edit2,
  Trash2,
  Receipt,
  FileText,
  Printer,
  Calendar,
  Building2,
  Phone,
  UserCheck,
  ChevronDown,
  X,
  Send,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface CreditSalesScreenProps {
  org: Organization;
  currentUser: User;
  customers: Customer[];
  products: Product[];
  onReloadCustomers?: () => void;
}

export const CreditSalesScreen: React.FC<CreditSalesScreenProps> = ({
  org,
  currentUser,
  customers,
  products,
  onReloadCustomers,
}) => {
  const [creditSales, setCreditSales] = useState<CreditSale[]>(() => db.getCreditSales());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid' | 'overdue'>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCreditSale, setSelectedCreditSale] = useState<CreditSale | null>(null);
  const [editingCreditSale, setEditingCreditSale] = useState<CreditSale | null>(null);
  const [payingCreditSale, setPayingCreditSale] = useState<CreditSale | null>(null);
  const [statementSale, setStatementSale] = useState<CreditSale | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Credit Sale Form
  const [formCustomerId, setFormCustomerId] = useState(customers[0]?.id || '');
  const [formTermsDays, setFormTermsDays] = useState(30);
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([
    { productId: products[0]?.id || '', quantity: 1, unitPrice: products[0]?.sellingPrice || 0 },
  ]);
  const [formInitialDeposit, setFormInitialDeposit] = useState('0');

  // Payment Collection Form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'mpesa' | 'bank' | 'cheque'>('mpesa');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const reloadData = () => {
    const list = db.getCreditSales();
    // Auto-evaluate overdue status
    const today = new Date().toISOString().split('T')[0];
    list.forEach((cs) => {
      if (cs.status !== 'paid' && cs.status !== 'written_off' && cs.dueDate < today) {
        cs.status = 'overdue';
      }
    });
    db.saveCreditSales(list);
    setCreditSales(list);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered sales
  const filteredSales = creditSales.filter((cs) => {
    const matchesStatus = statusFilter === 'all' || cs.status === statusFilter;
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      cs.invoiceNumber.toLowerCase().includes(s) ||
      cs.customerName.toLowerCase().includes(s) ||
      cs.customerPhone.includes(s) ||
      (cs.customerKraPin && cs.customerKraPin.toLowerCase().includes(s));
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalCreditIssued = creditSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalCollected = creditSales.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalOutstanding = creditSales.reduce((acc, s) => acc + s.balanceDue, 0);
  const overdueSales = creditSales.filter((s) => s.status === 'overdue');
  const totalOverdue = overdueSales.reduce((acc, s) => acc + s.balanceDue, 0);

  // Aging Chart Data (0-30, 31-60, 61-90, 90+ days)
  const now = Date.now();
  const agingData = [
    { name: 'Current (0-30d)', amount: 0, count: 0 },
    { name: '31-60 Days', amount: 0, count: 0 },
    { name: '61-90 Days', amount: 0, count: 0 },
    { name: '90+ Days', amount: 0, count: 0 },
  ];

  creditSales.forEach((cs) => {
    if (cs.balanceDue > 0) {
      const ageDays = Math.floor((now - new Date(cs.createdAt).getTime()) / (86400000));
      if (ageDays <= 30) {
        agingData[0].amount += cs.balanceDue;
        agingData[0].count += 1;
      } else if (ageDays <= 60) {
        agingData[1].amount += cs.balanceDue;
        agingData[1].count += 1;
      } else if (ageDays <= 90) {
        agingData[2].amount += cs.balanceDue;
        agingData[2].count += 1;
      } else {
        agingData[3].amount += cs.balanceDue;
        agingData[3].count += 1;
      }
    }
  });

  const pieData = [
    { name: 'Collected Amount', value: totalCollected, color: '#10b981' },
    { name: 'Current Outstanding', value: Math.max(0, totalOutstanding - totalOverdue), color: '#3b82f6' },
    { name: 'Overdue Balance', value: totalOverdue, color: '#ef4444' },
  ];

  // Handle Add Item to new Credit Sale
  const handleAddFormItem = () => {
    const firstProd = products[0];
    setFormItems([...formItems, { productId: firstProd?.id || '', quantity: 1, unitPrice: firstProd?.sellingPrice || 0 }]);
  };

  const handleRemoveFormItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleItemProductChange = (idx: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    const updated = [...formItems];
    updated[idx] = {
      productId: pId,
      quantity: updated[idx].quantity,
      unitPrice: prod ? prod.sellingPrice : updated[idx].unitPrice,
    };
    setFormItems(updated);
  };

  const handleItemQtyChange = (idx: number, qty: number) => {
    const updated = [...formItems];
    updated[idx].quantity = Math.max(1, qty);
    setFormItems(updated);
  };

  const handleItemPriceChange = (idx: number, price: number) => {
    const updated = [...formItems];
    updated[idx].unitPrice = Math.max(0, price);
    setFormItems(updated);
  };

  const formTotalAmount = formItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  // Submit New Credit Sale
  const handleCreateCreditSale = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === formCustomerId);
    if (!cust) {
      alert('Please select a valid customer.');
      return;
    }

    if (formItems.length === 0 || formTotalAmount <= 0) {
      alert('Please add at least one billable item.');
      return;
    }

    const deposit = parseFloat(formInitialDeposit) || 0;
    const balance = Math.max(0, formTotalAmount - deposit);
    const invoiceNum = `INV-CR-${Date.now().toString().slice(-6)}`;
    const dueDateStr = new Date(Date.now() + formTermsDays * 86400000).toISOString().split('T')[0];

    const mappedItems = formItems.map((item) => {
      const p = products.find((prod) => prod.id === item.productId)!;
      return {
        product: p,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        total: item.quantity * item.unitPrice,
      };
    });

    const newCS: CreditSale = {
      id: `CS-${Date.now()}`,
      invoiceNumber: invoiceNum,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerKraPin: cust.kraPin,
      items: mappedItems,
      subtotal: formTotalAmount,
      totalAmount: formTotalAmount,
      amountPaid: deposit,
      balanceDue: balance,
      status: balance <= 0 ? 'paid' : deposit > 0 ? 'partial' : 'unpaid',
      creditTermsDays: formTermsDays,
      dueDate: dueDateStr,
      createdAt: new Date().toISOString(),
      tillId: 'TILL-01',
      tillName: 'Main Counter',
      staffId: currentUser.staffId,
      staffName: currentUser.firstName,
      notes: formNotes,
      payments:
        deposit > 0
          ? [
              {
                id: `CPAY-${Date.now()}`,
                creditSaleId: `CS-${Date.now()}`,
                amount: deposit,
                paymentMethod: 'cash',
                reference: 'Initial Deposit',
                paymentDate: new Date().toISOString(),
                staffId: currentUser.staffId,
                staffName: currentUser.firstName,
                notes: 'Deposit received at invoice issuance',
              },
            ]
          : [],
    };

    db.addCreditSale(newCS);

    // Auto deduct inventory stock (including composition bases!)
    const allProds = db.getProducts();
    mappedItems.forEach((it) => {
      const prod = allProds.find((p) => p.id === it.product.id);
      if (prod) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - it.quantity);

        // Deduct composition bases if composite paint
        if (prod.isComposition && prod.composition && prod.composition.length > 0) {
          prod.composition.forEach((comp) => {
            const baseDeduct = comp.quantityRequired * it.quantity;
            const b = allProds.find((x) => x.id === comp.baseProductId);
            if (b) {
              b.stockQuantity = Math.max(0, Math.round((b.stockQuantity - baseDeduct) * 100) / 100);
            }
          });
        }
      }
    });
    db.saveProducts(allProds);

    reloadData();
    setIsCreateOpen(false);
    showToast(`Credit Sale #${invoiceNum} successfully booked!`);
  };

  // Submit Payment Collection
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCreditSale) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }
    if (amount > payingCreditSale.balanceDue) {
      alert(`Amount exceeds outstanding balance of ${org.currency} ${payingCreditSale.balanceDue.toLocaleString()}.`);
      return;
    }

    db.recordCreditPayment(
      payingCreditSale.id,
      amount,
      payMethod,
      payRef || `REF-${Date.now().toString().slice(-6)}`,
      currentUser.firstName,
      payNotes
    );

    reloadData();
    setPayingCreditSale(null);
    setPayAmount('');
    setPayRef('');
    setPayNotes('');
    showToast(`Payment of ${org.currency} ${amount.toLocaleString()} recorded successfully!`);
  };

  // Handle Edit Save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCreditSale) return;
    db.updateCreditSale(editingCreditSale);
    reloadData();
    setEditingCreditSale(null);
    showToast('Credit sale updated successfully.');
  };

  // Handle Delete / Write-off
  const handleDeleteCreditSale = (cs: CreditSale) => {
    if (confirm(`Are you sure you want to delete / void Credit Invoice #${cs.invoiceNumber}? This action cannot be undone.`)) {
      db.deleteCreditSale(cs.id);
      reloadData();
      showToast(`Credit Invoice #${cs.invoiceNumber} deleted.`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Credit Sales & Debtor Accounts Ledger
              </h1>
              <p className="text-xs text-slate-500">
                Track credit invoices, customer aging brackets, scheduled due dates & debt collections
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFormCustomerId(customers[0]?.id || '');
              setFormItems([{ productId: products[0]?.id || '', quantity: 1, unitPrice: products[0]?.sellingPrice || 0 }]);
              setFormInitialDeposit('0');
              setFormNotes('');
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 active:scale-98 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Credit Invoice</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Credit Issued</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {org.currency} {totalCreditIssued.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total volume across {creditSales.length} invoices</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Collected</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {org.currency} {totalCollected.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {totalCreditIssued > 0 ? Math.round((totalCollected / totalCreditIssued) * 100) : 0}% recovery rate
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Outstanding Balance</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">
            {org.currency} {totalOutstanding.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Pending debtor settlements</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Overdue Risk</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">
            {org.currency} {totalOverdue.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-rose-600 font-medium">
            {overdueSales.length} invoice(s) past agreed term
          </p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aging Analysis Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Debtor Aging Analysis (KES Outstanding)</h3>
              <p className="text-xs text-slate-500">Categorized by invoice age elapsed since generation</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              FIFO Aging Schedule
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${val / 1000}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`${org.currency} ${Number(val).toLocaleString()}`, 'Balance Due']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#fff' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection Breakdown Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Portfolio Distribution</h3>
            <p className="text-xs text-slate-500">Ratio of collected funds vs active credit exposure</p>
          </div>
          <div className="h-48 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${org.currency} ${Number(val).toLocaleString()}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            {pieData.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-slate-500 leading-tight">{item.name}</span>
                <span className="text-[11px] font-bold text-slate-800">
                  {org.currency} {Math.round(item.value / 1000)}k
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Datatable Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice, customer, phone, PIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Status:
            </span>
            {(['all', 'unpaid', 'partial', 'paid', 'overdue'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize shrink-0 ${
                  statusFilter === st
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Datatable */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total (KES)</th>
                <th className="py-3 px-4 text-right">Paid (KES)</th>
                <th className="py-3 px-4 text-right">Balance (KES)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No credit invoices matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((cs) => {
                  const isPastDue = cs.status === 'overdue' || (cs.balanceDue > 0 && cs.dueDate < new Date().toISOString().split('T')[0]);

                  return (
                    <tr key={cs.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {cs.invoiceNumber}
                        {cs.receiptNumber && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            ETR: {cs.receiptNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cs.customerName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cs.customerPhone}</span>
                        </div>
                        {cs.customerKraPin && (
                          <div className="text-[10px] text-slate-400 font-mono">PIN: {cs.customerKraPin}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {cs.items.length} line item(s)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(cs.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className={`font-semibold ${isPastDue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                          {new Date(cs.dueDate).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400">{cs.creditTermsDays} Days Term</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {cs.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        {cs.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-700">
                        {cs.balanceDue.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            cs.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cs.status === 'overdue' || isPastDue
                              ? 'bg-rose-100 text-rose-800'
                              : cs.status === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {cs.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                          {cs.status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                          {cs.status === 'partial' && <Clock className="w-3 h-3" />}
                          {cs.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* VIEW DETAILS */}
                          <button
                            type="button"
                            title="View Invoice Dossier"
                            onClick={() => setSelectedCreditSale(cs)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* RECORD PAYMENT */}
                          {cs.balanceDue > 0 && (
                            <button
                              type="button"
                              title="Record Installment Payment"
                              onClick={() => {
                                setPayingCreditSale(cs);
                                setPayAmount(cs.balanceDue.toString());
                                setPayRef('');
                                setPayNotes('');
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition font-bold"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}

                          {/* PRINT STATEMENT */}
                          <button
                            type="button"
                            title="Print Statement of Account"
                            onClick={() => setStatementSale(cs)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* EDIT */}
                          <button
                            type="button"
                            title="Edit Terms / Notes"
                            onClick={() => setEditingCreditSale({ ...cs })}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            title="Delete / Void Invoice"
                            onClick={() => handleDeleteCreditSale(cs)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE CREDIT SALE */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Book New Credit Sale Invoice</h3>
                <p className="text-xs text-slate-500">Issue commercial goods on customer credit terms</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCreditSale} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Account</label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - Limit: {org.currency} {c.creditLimit.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credit Terms (Days)</label>
                  <select
                    value={formTermsDays}
                    onChange={(e) => setFormTermsDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={7}>7 Days (Weekly)</option>
                    <option value={14}>14 Days (Bi-weekly)</option>
                    <option value={30}>30 Days (Net 30)</option>
                    <option value={45}>45 Days (Net 45)</option>
                    <option value={60}>60 Days (Net 60)</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">Invoice Items</label>
                  <button
                    type="button"
                    onClick={handleAddFormItem}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemProductChange(idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.unit}) - {org.currency} {p.sellingPrice.toLocaleString()}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemQtyChange(idx, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold"
                        placeholder="Qty"
                      />

                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-bold"
                        placeholder="Price"
                      />

                      <span className="text-xs font-extrabold text-slate-800 w-24 text-right">
                        {(item.quantity * item.unitPrice).toLocaleString()}
                      </span>

                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFormItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Down Payment (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={formInitialDeposit}
                    onChange={(e) => setFormInitialDeposit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="bg-slate-100 p-3 rounded-xl flex flex-col justify-center">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Total Amount:</span>
                    <span className="font-bold text-slate-900">{org.currency} {formTotalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-extrabold text-amber-700 mt-1">
                    <span>Balance Due on Terms:</span>
                    <span>
                      {org.currency}{' '}
                      {Math.max(0, formTotalAmount - (parseFloat(formInitialDeposit) || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Contract Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Delivery to Site Gate 2, authorized by Site Foreman"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 active:scale-98 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Confirm & Issue Credit Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT */}
      {payingCreditSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Debtor Settlement</h3>
                <p className="text-xs text-slate-500">Invoice: {payingCreditSale.invoiceNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setPayingCreditSale(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <div className="text-xs text-amber-800">Customer: <strong>{payingCreditSale.customerName}</strong></div>
              <div className="text-xs text-amber-800 mt-1">
                Outstanding Balance: <strong className="text-sm">{org.currency} {payingCreditSale.balanceDue.toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (KES)</label>
                <input
                  type="number"
                  step="0.01"
                  max={payingCreditSale.balanceDue}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tender Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="mpesa">M-Pesa STK / Till</option>
                  <option value="cash">Cash Register</option>
                  <option value="bank">Bank Wire / RTGS / EFT</option>
                  <option value="cheque">Banker's Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Transaction ID</label>
                <input
                  type="text"
                  required
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g., QKD9871234 or EFT-77881"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Part payment for site delivery"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingCreditSale(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Confirm & Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW INVOICE DOSSIER */}
      {selectedCreditSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-sm">
                  CR
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCreditSale.invoiceNumber}</h3>
                  <p className="text-xs text-slate-500">Issued: {new Date(selectedCreditSale.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCreditSale(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Credit Profile */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Debtor Profile</span>
                <span className="font-extrabold text-slate-900 block text-sm">{selectedCreditSale.customerName}</span>
                <span className="text-slate-600 block">{selectedCreditSale.customerPhone}</span>
                {selectedCreditSale.customerKraPin && (
                  <span className="text-slate-500 font-mono block">KRA PIN: {selectedCreditSale.customerKraPin}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Credit Schedule</span>
                <span className="text-slate-700 block">Terms: <strong>{selectedCreditSale.creditTermsDays} Days</strong></span>
                <span className="text-slate-700 block">Due Date: <strong>{new Date(selectedCreditSale.dueDate).toLocaleDateString()}</strong></span>
                <span className="text-slate-700 block">Served By: <strong>{selectedCreditSale.staffName}</strong></span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Itemized Products</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCreditSale.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold text-slate-800">{it.product?.name || 'Product'}</td>
                        <td className="py-2 px-3 text-center font-bold">{it.quantity}</td>
                        <td className="py-2 px-3 text-right">{it.unitPrice.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold">{it.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Ledger & Installments */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payment History & Installments</h4>
              {selectedCreditSale.payments.length === 0 ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center border border-slate-200">
                  No installment payments collected yet for this invoice.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-emerald-50 text-emerald-800 font-bold border-b border-emerald-200">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Method</th>
                        <th className="py-2 px-3">Reference</th>
                        <th className="py-2 px-3 text-right">Amount (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedCreditSale.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                          <td className="py-2 px-3 uppercase font-bold text-slate-700">{p.paymentMethod}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{p.reference}</td>
                          <td className="py-2 px-3 text-right font-extrabold text-emerald-700">
                            {p.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Balances Summary */}
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 block">Total Invoice Amount</span>
                <span className="text-lg font-black">{org.currency} {selectedCreditSale.totalAmount.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-amber-400 block font-bold">Remaining Balance Due</span>
                <span className="text-xl font-black text-amber-400">
                  {org.currency} {selectedCreditSale.balanceDue.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCreditSale(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: STATEMENT OF ACCOUNT (PRINTABLE) */}
      {statementSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-300 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Statement of Account</span>
              <button
                type="button"
                onClick={() => setStatementSale(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Statement Layout */}
            <div className="space-y-4 border border-slate-200 p-5 rounded-xl bg-white text-xs text-slate-800">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase">{org.name}</h3>
                <p className="text-[11px] text-slate-500">{org.address}</p>
                <p className="text-[11px] text-slate-500">Tel: {org.phone} | KRA PIN: {org.kraPin}</p>
              </div>

              <div className="flex justify-between text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold">BILLED TO:</span>
                  <span className="font-bold text-slate-900 block">{statementSale.customerName}</span>
                  <span className="text-slate-600 block">{statementSale.customerPhone}</span>
                  {statementSale.customerKraPin && <span className="font-mono text-slate-500">PIN: {statementSale.customerKraPin}</span>}
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold">STATEMENT DETAILS:</span>
                  <span className="font-mono font-bold text-slate-900 block">{statementSale.invoiceNumber}</span>
                  <span className="text-slate-600 block">Due: {new Date(statementSale.dueDate).toLocaleDateString()}</span>
                  <span className="font-bold uppercase text-amber-700 block mt-1">{statementSale.status}</span>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-2 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Gross Invoice Total:</span>
                  <span>{org.currency} {statementSale.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Total Payments Settled:</span>
                  <span>- {org.currency} {statementSale.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-black text-sm pt-1 border-t border-dashed border-slate-200">
                  <span>OUTSTANDING BALANCE:</span>
                  <span>{org.currency} {statementSale.balanceDue.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center">
                Please remit payments to M-Pesa Paybill / Till or NCBA Bank Account. For disputes, contact accounts at {org.phone}.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>
              <button
                type="button"
                onClick={() => setStatementSale(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT CREDIT SALE */}
      {editingCreditSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Credit Terms & Notes</h3>
              <button
                type="button"
                onClick={() => setEditingCreditSale(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editingCreditSale.dueDate}
                  onChange={(e) => setEditingCreditSale({ ...editingCreditSale, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Terms Days</label>
                <input
                  type="number"
                  value={editingCreditSale.creditTermsDays}
                  onChange={(e) =>
                    setEditingCreditSale({ ...editingCreditSale, creditTermsDays: parseInt(e.target.value) || 30 })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={3}
                  value={editingCreditSale.notes || ''}
                  onChange={(e) => setEditingCreditSale({ ...editingCreditSale, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCreditSale(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
