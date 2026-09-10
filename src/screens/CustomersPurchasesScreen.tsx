import React, { useState } from 'react';
import { Customer, Supplier, Product, Organization, User } from '../types';
import { CustomersScreen } from './CustomersScreen';
import { PurchasesScreen } from './PurchasesScreen';
import { SuppliersScreen } from './SuppliersScreen';
import {
  Users,
  ShoppingBag,
  Building,
} from 'lucide-react';

interface CustomersPurchasesScreenProps {
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  org: Organization;
  currentUser: User;
  users: User[];
  onReloadCustomers: () => void;
  onReloadSuppliers: () => void;
  onReloadProducts: () => void;
  onViewReceipt?: (sale: any) => void;
}

export const CustomersPurchasesScreen: React.FC<CustomersPurchasesScreenProps> = ({
  customers,
  suppliers,
  products,
  org,
  currentUser,
  users,
  onReloadCustomers,
  onReloadSuppliers,
  onReloadProducts,
  onViewReceipt,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'purchases' | 'suppliers'>('customers');

  return (
    <div className="space-y-4">
      {/* Top Sub-Tab Navigation Header */}
      <div className="px-6 pt-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Customers, Procurement & Supplier Ledgers
          </h2>
          <p className="text-xs text-slate-500">
            B2B accounts, KRA PIN compliance, Goods Received Notes (GRN), and supplier terms.
          </p>
        </div>

        {/* 3 Solid Sub-Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('customers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'customers'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers & Wallets ({customers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('purchases')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'purchases'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Purchases & GRN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('suppliers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'suppliers'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Suppliers ({suppliers.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-tab view components */}
      {activeSubTab === 'customers' && (
        <CustomersScreen
          customers={customers}
          org={org}
          onReloadCustomers={onReloadCustomers}
          onViewReceipt={onViewReceipt}
        />
      )}

      {activeSubTab === 'purchases' && (
        <PurchasesScreen
          suppliers={suppliers}
          products={products}
          org={org}
          currentUser={currentUser}
          onReloadProducts={onReloadProducts}
        />
      )}

      {activeSubTab === 'suppliers' && (
        <SuppliersScreen
          suppliers={suppliers}
          org={org}
          currentUser={currentUser}
          users={users}
          onReloadSuppliers={onReloadSuppliers}
        />
      )}
    </div>
  );
};
