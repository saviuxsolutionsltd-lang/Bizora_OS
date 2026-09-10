import React, { useState } from 'react';
import { Organization, User, Till } from '../types';
import { db, INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS } from '../services/db';
import {
  Building2,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface InitialSetupWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const InitialSetupWizard: React.FC<InitialSetupWizardProps> = ({ isOpen, onComplete }) => {
  const currentOrg = db.getOrg();

  // Org State
  const [businessName, setBusinessName] = useState(currentOrg.name || 'Bizora Hardware & Electricals Ltd');
  const [tradingName, setTradingName] = useState(currentOrg.tradingName || 'Bizora Hardware & Building Solutions');
  const [branchName, setBranchName] = useState(currentOrg.branchName || 'Nairobi Central Hub');
  const [kraPin, setKraPin] = useState(currentOrg.kraPin || 'P051892341M');
  const [etimsCiuSeries, setEtimsCiuSeries] = useState(currentOrg.etimsCiuSeries || 'CIU-ETIMS-2026-NBI-');
  const [fiscalSerial, setFiscalSerial] = useState(currentOrg.fiscalDeviceSerial || 'BZR-FD-892401');
  const [currency, setCurrency] = useState('KES');
  const [phone, setPhone] = useState('+254 700 892 400');
  const [address, setAddress] = useState('Commercial Street, Industrial Area, Nairobi');

  // Owner State (FirstName + 4 digit staff id)
  const [ownerFirst, setOwnerFirst] = useState('David');
  const [ownerLast, setOwnerLast] = useState('Mwangi');
  const [ownerStaffId, setOwnerStaffId] = useState('1001');
  const [ownerPin, setOwnerPin] = useState('123456');

  // SuperAdmin State
  const [saFirst, setSaFirst] = useState('Super');
  const [saLast, setSaLast] = useState('Administrator');
  const [saStaffId, setSaStaffId] = useState('0001');
  const [saPin, setSaPin] = useState('889900');

  // Starter Products
  const [seedHardwareProducts, setSeedHardwareProducts] = useState(true);

  if (!isOpen) return null;

  const ownerUsername = `${ownerFirst.toLowerCase().replace(/[^a-z0-9]/g, '')}${ownerStaffId}`;
  const saUsername = `${saFirst.toLowerCase().replace(/[^a-z0-9]/g, '')}${saStaffId}`;

  const handleSaveSetup = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedOrg: Organization = {
      name: businessName,
      tradingName,
      branchName,
      kraPin: kraPin.toUpperCase(),
      etimsCiuSeries,
      fiscalDeviceSerial: fiscalSerial,
      currency,
      taxRatePercent: 16,
      phone,
      email: 'operations@bizora.co.ke',
      address,
      idleTimeoutMinutes: 15,
      autoLockEnabled: false,
      receiptHeader: `${businessName.toUpperCase()}\n${tradingName.toUpperCase()}\nTel: ${phone}`,
      receiptFooter: 'Goods once sold are returnable within 48 hours in original condition.\nThank you for choosing BizoraOS ERP POS!',
      isConfigured: true,
    };

    const ownerUser: User = {
      id: `USR-OWN-${ownerStaffId}`,
      staffId: ownerStaffId,
      username: ownerUsername,
      firstName: ownerFirst,
      lastName: ownerLast,
      role: 'owner',
      pin: ownerPin,
      email: `${ownerFirst.toLowerCase()}@bizora.co.ke`,
      phone,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const saUser: User = {
      id: `USR-SA-${saStaffId}`,
      staffId: saStaffId,
      username: saUsername,
      firstName: saFirst,
      lastName: saLast,
      role: 'superadmin',
      pin: saPin,
      email: 'superadmin@bizora.co.ke',
      phone,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const initialTills: Till[] = [
      {
        id: 'TILL-01',
        name: 'Till 01 - Main Hardware Counter',
        deviceToken: 'DEV-POS-NBI-01',
        status: 'active',
        registeredDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        location: 'Ground Floor Counter A',
      },
      {
        id: 'TILL-02',
        name: 'Till 02 - Paints Mixing & Fasteners Desk',
        deviceToken: 'DEV-POS-NBI-02',
        status: 'active',
        registeredDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        location: 'Color Studio & Fasteners Desk',
      },
    ];

    db.saveOrg(updatedOrg);
    db.saveUsers([saUser, ownerUser]);
    db.saveTills(initialTills);
    db.setCurrentTill(initialTills[0].id);
    db.setCurrentUser(ownerUser.id);

    if (seedHardwareProducts) {
      db.saveProducts(INITIAL_PRODUCTS);
      db.saveCustomers(INITIAL_CUSTOMERS);
      db.saveSuppliers(INITIAL_SUPPLIERS);
    } else {
      db.saveProducts([]);
      db.saveCustomers([]);
      db.saveSuppliers([]);
    }

    db.addAuditLog({
      id: `AUD-SETUP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'ORGANIZATION_CONFIGURED',
      module: 'ORGANIZATION',
      staffId: ownerStaffId,
      staffName: `${ownerFirst} ${ownerLast}`,
      tillId: 'TILL-01',
      details: `Initialized organization ${businessName} with KRA PIN ${kraPin} and CIU Series ${etimsCiuSeries}.`,
      severity: 'info',
      ipOrDevice: 'Setup Wizard',
    });

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="bg-gradient-to-r from-[#0d1b2a] to-blue-900 px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl">
              <Building2 className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">BizoraOS Organization & System Setup</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Hardware & Electricals Master POS • eTIMS CIU Series • Clean Database Deployment
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSetup} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Business Profile */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>1. Business & KRA eTIMS Fiscal Profile</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Trading Name *</label>
                <input
                  type="text"
                  required
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Branch / Location *</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Business KRA PIN *</label>
                <input
                  type="text"
                  required
                  value={kraPin}
                  onChange={(e) => setKraPin(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  ETIMS CIU Series Format (Pick / Set) *
                </label>
                <input
                  type="text"
                  required
                  value={etimsCiuSeries}
                  onChange={(e) => setEtimsCiuSeries(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono"
                  placeholder="e.g. CIU-ETIMS-2026-NBI-"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Fiscal Device Serial *</label>
                <input
                  type="text"
                  required
                  value={fiscalSerial}
                  onChange={(e) => setFiscalSerial(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Currency Code</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Official Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Owner Credentials */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-1.5">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>2. Business Owner (Primary Authority)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={ownerFirst}
                  onChange={(e) => setOwnerFirst(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={ownerLast}
                  onChange={(e) => setOwnerLast(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">Staff ID (4 Digits)</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={ownerStaffId}
                  onChange={(e) => setOwnerStaffId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">6-Digit PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white font-mono text-center tracking-widest"
                />
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-800 text-[11px] flex items-center justify-between">
              <span>Auto-Generated Username:</span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                {ownerUsername}
              </span>
            </div>
          </div>

          {/* SuperAdmin Credentials */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>3. SuperAdmin (System Security, Audits & Device Oversight)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={saFirst}
                  onChange={(e) => setSaFirst(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={saLast}
                  onChange={(e) => setSaLast(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">Staff ID (4 Digits)</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={saStaffId}
                  onChange={(e) => setSaStaffId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">6-Digit PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={saPin}
                  onChange={(e) => setSaPin(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white font-mono text-center tracking-widest"
                />
              </div>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-lg text-purple-800 text-[11px] flex items-center justify-between">
              <span>Auto-Generated Username:</span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-200">
                {saUsername}
              </span>
            </div>
          </div>

          {/* Starter Data Option */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <div className="font-bold text-slate-800">Seed Certified Hardware & Electricals Catalog</div>
                <div className="text-[11px] text-slate-500">
                  Includes EA Cables, Schneider breakers, Crown paints (multiple paint bases), PPR pipes, Bamburi cement.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={seedHardwareProducts}
                onChange={(e) => setSeedHardwareProducts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Initialize System & Commence Realtime Operations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
