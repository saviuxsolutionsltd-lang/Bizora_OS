import React from 'react';
import {
  LayoutDashboard,
  Store,
  Tag,
  Layers,
  Banknote,
  Users,
  BarChart3,
  CreditCard,
  ShieldCheck,
  Settings,
  Bolt,
  Download,
  LogOut,
} from 'lucide-react';
import { User } from '../types';

export type NavTab =
  | 'dashboard'
  | 'pos'
  | 'products_catalog'
  | 'inventory_stock'
  | 'sales_quotations'
  | 'customers_purchases'
  | 'reports'
  | 'till_drawer'
  | 'security'
  | 'settings'
  | 'export'
  // Legacy aliases supported for seamless backwards compatibility
  | 'sale_audit'
  | 'sales_audit'
  | 'final_sales'
  | 'quotations'
  | 'deliveries'
  | 'sales'
  | 'inventory'
  | 'purchases'
  | 'suppliers'
  | 'customers'
  | 'till_eod';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User;
  pendingApprovalsCount?: number;
  onOpenExport?: () => void;
  onLockScreen?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  pendingApprovalsCount = 0,
  onOpenExport,
  onLockScreen,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'pos', label: 'POS Workspace', icon: Store, badge: null },
    { id: 'products_catalog', label: 'Products & Catalog', icon: Tag, badge: null },
    { id: 'inventory_stock', label: 'Inventory & Stock', icon: Layers, badge: null },
    { id: 'sales_quotations', label: 'Sales & Quotations', icon: Banknote, badge: null },
    { id: 'customers_purchases', label: 'Customers & Purchases', icon: Users, badge: null },
    { id: 'reports', label: 'Reports Console', icon: BarChart3, badge: null },
    {
      id: 'till_drawer',
      label: 'Till & Cash Drawer',
      icon: CreditCard,
      badge: '1',
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'security',
      label: 'Security & Audit',
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'settings', label: 'Settings & Admin', icon: Settings, badge: null },
  ];

  const isTabActive = (tabId: string) => {
    if (activeTab === tabId) return true;
    if (tabId === 'products_catalog' && activeTab === 'inventory') return true;
    if (tabId === 'inventory_stock' && (activeTab === 'stock' as any)) return true;
    if (tabId === 'sales_quotations' && (activeTab === 'sale_audit' || activeTab === 'quotations' || activeTab === 'sales' || activeTab === 'deliveries')) return true;
    if (tabId === 'customers_purchases' && (activeTab === 'customers' || activeTab === 'purchases' || activeTab === 'suppliers')) return true;
    if (tabId === 'till_drawer' && activeTab === 'till_eod') return true;
    return false;
  };

  return (
    <aside className="w-64 bg-[#101f42] text-slate-300 flex flex-col shrink-0 select-none border-r border-[#1a2e63]">
      {/* Brand Header - Exact from screenshots: Orange square with bolt + BIZORA OS */}
      <div className="p-5 border-b border-blue-900/40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#f59e0b] flex items-center justify-center text-slate-950 shadow-sm shrink-0">
          <Bolt className="w-6 h-6 text-slate-950 fill-slate-950" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white tracking-wider flex items-center gap-1 leading-tight">
            <span>BIZORA</span>
            <span className="text-[#f59e0b]">OS</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium">Hardware & Electricals ERP</p>
        </div>
      </div>

      {/* Navigation Links - Solid hover & active state, NO gradients */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isTabActive(item.id);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                active
                  ? 'bg-[#1e3a8a] text-white shadow-xs border border-blue-400/30'
                  : 'text-slate-300 hover:bg-[#192f66] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${active ? 'text-[#f59e0b]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-blue-800 text-blue-100'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Flutter + PHP Solution Card from screenshot */}
      <div className="p-3 mx-3 mb-3 bg-[#0c1836] border border-blue-950 rounded-xl space-y-2">
        <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
          <span>Flutter + PHP Solution</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Ready for Desktop, APK & Web deployment.
        </p>
        <button
          type="button"
          onClick={() => {
            if (onOpenExport) onOpenExport();
            else onSelectTab('export');
          }}
          className="w-full py-2 bg-[#f59e0b] hover:bg-[#d97706] active:scale-98 text-slate-950 text-xs font-extrabold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-950" />
          <span>Download Full ZIP</span>
        </button>
      </div>

      {/* User Info Bar at bottom matching screenshots */}
      <div className="p-3 border-t border-blue-900/40 flex items-center justify-between bg-[#0e1b3a]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
            {currentUser.firstName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">
              {currentUser.firstName} {currentUser.lastName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              ID: {currentUser.staffId} - {currentUser.role.toUpperCase()}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLockScreen}
          title="Lock Screen / Switch Attendant"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
