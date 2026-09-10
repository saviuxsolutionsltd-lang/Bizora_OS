import React, { useState } from 'react';
import { Organization, Till, User } from '../types';
import {
  Building2,
  Barcode,
  Monitor,
  CheckCircle2,
  Download,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';

interface NavbarProps {
  screenTitle?: string;
  org: Organization;
  currentTill: Till;
  currentUser: User;
  tills: Till[];
  users: User[];
  onSelectTill: (till: Till) => void;
  onSelectUser: (user: User) => void;
  onOpenScanner: () => void;
  onLockScreen: () => void;
  onOpenOrgSetup: () => void;
  onResetDatabase?: () => void;
  onDownloadZip?: () => void;
  pendingApprovalsCount?: number;
  onOpenMakerChecker?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  screenTitle = 'Executive Operational Dashboard',
  org,
  currentTill,
  currentUser,
  tills,
  onSelectTill,
  onOpenScanner,
  onDownloadZip,
  pendingApprovalsCount = 0,
  onOpenMakerChecker,
}) => {
  const [showTillMenu, setShowTillMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-2xs z-20 shrink-0">
      {/* Left Screen Title & Compliance Subtitle - Matching all screenshots */}
      <div className="flex flex-col">
        <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
          {screenTitle}
        </h2>
        <span className="text-[10px] text-slate-400 font-medium">
          Compliant with eTIMS & ETR CIU Standards
        </span>
      </div>

      {/* Right Controls Row - Exact from screenshots */}
      <div className="flex items-center gap-2.5">
        {/* 1. Branch Dropdown Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTillMenu(!showTillMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 text-blue-900 text-xs font-bold hover:bg-blue-100/80 transition"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-700" />
            <span className="max-w-[150px] truncate">{org.branchName || 'Main Branch (Industrial Area)'}</span>
            <ChevronDown className="w-3 h-3 text-blue-500" />
          </button>

          {showTillMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                Switch Branch / Counter Till
              </div>
              {tills.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectTill(t);
                    setShowTillMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                    t.id === currentTill.id ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-700'
                  }`}
                >
                  <span>{t.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{t.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Scan Barcode Pill */}
        <button
          type="button"
          onClick={onOpenScanner}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
        >
          <Barcode className="w-3.5 h-3.5 text-indigo-600" />
          <span>Scan Barcode</span>
        </button>

        {/* 3. Till Active Float Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Till Active: {org.currency} 5,000.00</span>
        </div>

        {/* 4. DEV-COUNTER-01 (Auth) Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs font-bold">
          <Monitor className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentTill.id || 'DEV-COUNTER-01'} (Auth)</span>
        </div>

        {/* 5. Local LAN Synced Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local LAN: Synced</span>
        </div>

        {/* 6. Maker-Checker Pending Approvals Pill */}
        {pendingApprovalsCount > 0 && (
          <button
            type="button"
            onClick={onOpenMakerChecker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-extrabold hover:bg-amber-100 transition animate-pulse"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingApprovalsCount} Approvals Pending</span>
          </button>
        )}

        {/* 7. Download Source (.zip) Dark Navy Button */}
        <button
          type="button"
          onClick={onDownloadZip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#132252] hover:bg-[#1a2b6b] text-white text-xs font-bold shadow-xs transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-white" />
          <span>Download Source (.zip)</span>
        </button>
      </div>
    </header>
  );
};
