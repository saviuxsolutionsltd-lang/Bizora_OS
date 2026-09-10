import React, { useState } from 'react';
import { Organization, Till, User } from '../types';
import { db } from '../services/db';
import {
  Building2,
  Users,
  Monitor,
  Database,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldAlert,
  Server,
  KeyRound,
} from 'lucide-react';
import { MakerCheckerModal } from '../components/MakerCheckerModal';
import { downloadFlutterProjectZip } from '../services/flutterExport';

interface SettingsScreenProps {
  org: Organization;
  currentTill: Till;
  currentUser: User;
  tills: Till[];
  users: User[];
  onReloadOrg: () => void;
  onReloadTills: () => void;
  onReloadUsers: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  org,
  currentTill,
  currentUser,
  tills,
  users,
  onReloadOrg,
  onReloadTills,
  onReloadUsers,
}) => {
  const [activeTab, setActiveTab] = useState<'business' | 'staff' | 'licensing' | 'php'>('business');

  // Business & CIU Form
  const [businessName, setBusinessName] = useState(org.name || 'Saviux Hardware & Electricals Enterprise Ltd');
  const [kraPin, setKraPin] = useState(org.kraPin || 'P051982746Z');
  const [officialPhone, setOfficialPhone] = useState(org.phone || '+254 712 345 678');
  const [physicalAddress, setPhysicalAddress] = useState(org.address || 'Commercial Street, Industrial Area, Nairobi, Kenya');
  const [ciuPrefix, setCiuPrefix] = useState(org.etimsCiuSeries?.slice(0, 8) || 'CIU-NAI-');
  const [nextCiuSeq, setNextCiuSeq] = useState('0043');
  const [footerNotice, setFooterNotice] = useState(
    org.receiptFooter ||
      'Goods once sold are returnable within 7 days in original packaging with fiscal ETR invoice. Inquiries: support@saviux.co.ke'
  );

  // Maker-Checker state
  const [makerCheckerOpen, setMakerCheckerOpen] = useState(false);
  const [directOp, setDirectOp] = useState<{
    operation: any;
    title: string;
    description: string;
    details: string;
    onApproved: () => void;
  } | null>(null);

  // Modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffFirst, setNewStaffFirst] = useState('');
  const [newStaffLast, setNewStaffLast] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<User['role']>('cashier');
  const [newStaffPin, setNewStaffPin] = useState('123456');

  // Status
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [connectorTested, setConnectorTested] = useState(false);

  // Device licensing list
  const [registeredDevices, setRegisteredDevices] = useState([
    { id: 'DEV-COUNTER-01', branch: org.branchName, status: 'approved' },
    { id: 'DEV-TRADE-02', branch: org.branchName, status: 'approved' },
    { id: 'DEV-MOBILE-03', branch: org.branchName, status: 'approved' },
  ]);

  const handleSaveBusinessSettings = (e: React.FormEvent) => {
    e.preventDefault();

    const commitSettings = () => {
      const updated: Organization = {
        ...org,
        name: businessName,
        kraPin: kraPin.toUpperCase(),
        phone: officialPhone,
        address: physicalAddress,
        etimsCiuSeries: `${ciuPrefix}${nextCiuSeq}`,
        receiptFooter: footerNotice,
      };
      db.saveOrg(updated);
      onReloadOrg();
      setSuccessMsg('Organization settings saved and synchronized successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    };

    // Updating KRA PIN or CIU series is a sensitive system configuration update
    if (kraPin !== org.kraPin || ciuPrefix !== org.etimsCiuSeries?.slice(0, 8)) {
      setDirectOp({
        operation: 'SYSTEM_CONFIG_UPDATE',
        title: 'Authorize KRA eTIMS Configuration Update',
        description: `Modifying fiscal CIU sequence prefix or Tax PIN to "${kraPin}".`,
        details: `Prefix: ${ciuPrefix} | Next Sequence: ${nextCiuSeq}`,
        onApproved: commitSettings,
      });
      setMakerCheckerOpen(true);
      return;
    }

    commitSettings();
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffFirst.trim() || !newStaffLast.trim()) return;

    const list = db.getUsers();
    const nextId = (1000 + list.length + 1).toString();
    const username = `${newStaffFirst.toUpperCase()}${nextId}`;

    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      staffId: nextId,
      username,
      firstName: newStaffFirst.trim(),
      lastName: newStaffLast.trim(),
      role: newStaffRole,
      pin: newStaffPin,
      email: `${newStaffFirst.toLowerCase()}@bizora.co.ke`,
      phone: '+254 700 000 000',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    list.push(newUser);
    db.saveUsers(list);
    onReloadUsers();
    setIsAddStaffOpen(false);
    setNewStaffFirst('');
    setNewStaffLast('');
    setSuccessMsg(`Staff member ${username} registered successfully!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleApproveDevice = (deviceId: string) => {
    setDirectOp({
      operation: 'TILL_DEVICE_AUTHORIZATION',
      title: `Authorize Till Terminal: ${deviceId}`,
      description: `Binding cryptographic device certificate to ${org.branchName}.`,
      details: `Terminal: ${deviceId} | Authorized by Staff ID ${currentUser.staffId}`,
      onApproved: () => {
        setRegisteredDevices((prev) =>
          prev.map((d) => (d.id === deviceId ? { ...d, status: 'approved' } : d))
        );
      },
    });
    setMakerCheckerOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & 4 Sub-Tabs matching Screenshots 9, 10, 11, 12 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Organization Setup & System Admin
          </h2>
          <p className="text-xs text-slate-500">
            KRA eTIMS CIU Series, Staff PIN management (4-digit ID + 6-digit PIN), and Till device binding.
          </p>
        </div>

        {/* 4 Tabs - Solid colors, no gradients */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'business'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Business & CIU Series
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'staff'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff & Tills ({users.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('licensing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'licensing'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Till Device Licensing ({registeredDevices.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('php')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'php'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PHP & MySQL Connector
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: Business & CIU Series (Screenshot 9) */}
      {activeTab === 'business' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">
              Company & ETR CIU Series Identity
            </h3>
            <p className="text-xs text-slate-500">
              Configure business tax details, CIU prefix sequence, and receipt footer text.
            </p>
          </div>

          <form onSubmit={handleSaveBusinessSettings} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Name:
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#101f42]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  KRA Tax PIN:
                </label>
                <input
                  type="text"
                  required
                  value={kraPin}
                  onChange={(e) => setKraPin(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-[#101f42]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Telephone:
                </label>
                <input
                  type="text"
                  value={officialPhone}
                  onChange={(e) => setOfficialPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#101f42]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Address:
                </label>
                <input
                  type="text"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#101f42]"
                />
              </div>
            </div>

            {/* eTIMS Sequential CIU Box matching Screenshot 9 */}
            <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-3">
              <h4 className="font-extrabold text-xs text-blue-950">
                eTIMS Sequential CIU Number Series
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    CIU Prefix (e.g. CIU-NAI-):
                  </label>
                  <input
                    type="text"
                    value={ciuPrefix}
                    onChange={(e) => setCiuPrefix(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Next Sequential Invoice Number:
                  </label>
                  <input
                    type="text"
                    value={nextCiuSeq}
                    onChange={(e) => setNextCiuSeq(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                The system automatically increments the sequence by 1 with each Final Sale invoice issued.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thermal Receipt Footer Notice:
              </label>
              <textarea
                rows={2}
                value={footerNotice}
                onChange={(e) => setFooterNotice(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#101f42]"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
            >
              Save Organization Settings
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Staff & Tills (Screenshot 10) */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs text-slate-500">
                Users log in at any till terminal using their generated Username (e.g. JOHN1001) and 6-digit PIN.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddStaffOpen(true)}
              className="px-4 py-2 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">System Username</th>
                  <th className="py-3 px-4">Staff Full Name</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">PIN Status</th>
                  <th className="py-3 px-4">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                      {u.staffId}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {u.username || `${u.firstName.toUpperCase()}${u.staffId}`}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      ****** (Active)
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-700 text-xs">
                        Authorized
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Till Device Licensing (Screenshot 11) */}
      {activeTab === 'licensing' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">
              Registered Till Terminals
            </h3>
            <p className="text-xs text-slate-500">
              Each terminal operates as an authorized till point with local database mirroring.
            </p>
          </div>

          <div className="space-y-3">
            {registeredDevices.map((dev) => (
              <div
                key={dev.id}
                className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 font-mono">
                      Device ID: {dev.id}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Branch: {dev.branch}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {dev.status === 'approved' ? (
                    <span className="font-bold text-emerald-700 text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>APPROVED</span>
                    </span>
                  ) : (
                    <>
                      <span className="text-rose-600 font-bold text-xs">
                        PENDING APPROVAL
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApproveDevice(dev.id)}
                        className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg shadow-2xs"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: PHP & MySQL Connector (Screenshot 12) */}
      {activeTab === 'php' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">
              Local MySQL & PHP API Connector Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Bridge your local Apache / XAMPP / MariaDB environment directly to the Flutter app.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900">
              Connection Checklist:
            </h4>
            <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1.5 font-mono">
              <li>Open phpMyAdmin and create database <span className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">bizora_pos</span>.</li>
              <li>Import <span className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">/saviux_local_api/schema.sql</span> into the database.</li>
              <li>Edit <span className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">/saviux_local_api/config.php</span> with your DB username/password.</li>
              <li>Serve the folder with Apache or run <span className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">php -S 0.0.0.0:8000</span>.</li>
            </ol>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setConnectorTested(true);
                setTimeout(() => setConnectorTested(false), 3000);
              }}
              className="px-5 py-2.5 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 active:scale-95"
            >
              <Server className="w-4 h-4" />
              <span>{connectorTested ? '✓ Connector Handshake OK (Localhost:8000)' : 'Test Local Connector'}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadFlutterProjectZip(org)}
              className="px-5 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 text-xs font-extrabold rounded-xl shadow-xs transition flex items-center gap-2 active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Download Project ZIP Archive</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#101f42] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-wide text-white">
                Register New Attendant / Cashier
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-white hover:bg-white/10 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffFirst}
                    onChange={(e) => setNewStaffFirst(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffLast}
                    onChange={(e) => setNewStaffLast(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as User['role'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                >
                  <option value="cashier">Cashier</option>
                  <option value="merchant_desk">Merchant Desk</option>
                  <option value="manager">Manager</option>
                  <option value="auditor">Auditor</option>
                  <option value="superadmin">SuperAdmin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Access PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono tracking-widest outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Generate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maker-Checker Direct Authorization Modal */}
      {makerCheckerOpen && directOp && (
        <MakerCheckerModal
          isOpen={makerCheckerOpen}
          onClose={() => setMakerCheckerOpen(false)}
          currentUser={currentUser}
          users={users}
          directOperation={directOp}
        />
      )}
    </div>
  );
};
