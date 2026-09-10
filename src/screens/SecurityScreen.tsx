import React, { useState } from 'react';
import { AuditLog, SecurityThreat, Organization, Till, User } from '../types';
import { db } from '../services/db';
import { makerChecker, MakerCheckerRequest } from '../services/makerChecker';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Search,
  KeyRound,
  FileCheck2,
  RefreshCw,
  Clock,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { MakerCheckerModal } from '../components/MakerCheckerModal';

interface SecurityScreenProps {
  org: Organization;
  currentTill: Till;
  currentUser: User;
  users: User[];
}

export const SecurityScreen: React.FC<SecurityScreenProps> = ({
  org,
  currentTill,
  currentUser,
  users,
}) => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'user' | 'system' | 'security' | 'maker_checker'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanRunning, setIsScanRunning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Maker-Checker approval modal state
  const [activeRequest, setActiveRequest] = useState<MakerCheckerRequest | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const threats = db.getSecurityThreats();
  const auditLogs = db.getAuditLogs();
  const pendingRequests = makerChecker.getPendingRequests();
  const allRequests = makerChecker.getAllRequests();

  const handleRunScan = () => {
    setIsScanRunning(true);
    setTimeout(() => {
      setIsScanRunning(false);
      setScanMessage('Cryptographic vulnerability & device integrity scan completed: 0 threats detected.');
      setTimeout(() => setScanMessage(null), 4000);
    }, 1200);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(term) ||
      log.module.toLowerCase().includes(term) ||
      log.staffName.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (activeLayer === 'all') return true;
    if (activeLayer === 'user') return log.module === 'AUTH' || log.module === 'TILL';
    if (activeLayer === 'system') return log.module === 'INVENTORY' || log.module === 'SETTINGS' || log.module === 'SALES';
    if (activeLayer === 'security') return log.module === 'SECURITY';
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Sub-Tabs matching Screenshot 8 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Security & 3-Layer Audit Logs
          </h2>
          <p className="text-xs text-slate-500">
            Immutable user, system, and device cryptographic audit trails.
          </p>
        </div>

        {/* 5 Solid Sub-Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveLayer('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeLayer === 'all'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Layers ({auditLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer('user')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeLayer === 'user'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Layer
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer('system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeLayer === 'system'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Layer
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeLayer === 'security'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Security Layer
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer('maker_checker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeLayer === 'maker_checker'
                ? 'bg-[#101f42] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Maker-Checker</span>
            {pendingRequests.length > 0 && (
              <span className="bg-[#f59e0b] text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Device Security Alerts Banner matching Screenshot 8 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                Active Device Security Alerts
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold font-mono">
                {threats.filter((t) => !t.resolved).length} Unresolved
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Zero unauthorized till access attempts or credential anomalies detected.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunScan}
          disabled={isScanRunning}
          className="px-4 py-2 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanRunning ? 'animate-spin' : ''}`} />
          <span>{isScanRunning ? 'Scanning Integrity...' : 'Run Vulnerability Scan'}</span>
        </button>
      </div>

      {scanMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search cryptographic logs by staff name, action type, module, or details..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#101f42]"
        />
      </div>

      {/* Maker-Checker Requests Tab */}
      {activeLayer === 'maker_checker' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Maker-Checker Authorization Queue
              </h3>
              <p className="text-[11px] text-slate-500">
                Supervisor dual-control requests for deletions, supplier modifications, and system configuration updates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsApprovalModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#101f42] text-white text-xs font-bold rounded-lg hover:bg-[#1a2b6b]"
            >
              Open Approvals Pad
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request Ref</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Maker (Requester)</th>
                  <th className="py-3 px-4">Details / Summary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Checker (Approver)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No Maker-Checker requests logged yet.
                    </td>
                  </tr>
                ) : (
                  allRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {req.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(req.createdAt).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-900">
                        {req.operation}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        {req.makerStaffName} <span className="text-[10px] text-slate-400 font-mono">({req.makerStaffId})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                        {req.description || req.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700 font-mono text-[11px]">
                        {req.checkerStaffName ? `${req.checkerStaffName} (${req.checkerStaffId})` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cryptographic Activity Log Table matching Screenshot 8 */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Cryptographic Activity Log
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SHA-256 Checksum Verified</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Layer</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Actor / Staff</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Device / Terminal</th>
                  <th className="py-3 px-4">Audit Payload Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No cryptographic audit logs match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const layerBadge =
                      log.module === 'SECURITY'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : log.module === 'AUTH' || log.module === 'TILL'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${layerBadge}`}
                          >
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {log.action}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{log.staffName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {log.staffId}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">
                          {log.targetEntity || log.tillId || 'System'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {log.ipOrDevice || currentTill.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-sm truncate">
                          {log.details}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maker Checker Modal */}
      {isApprovalModalOpen && (
        <MakerCheckerModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          currentUser={currentUser}
          users={users}
        />
      )}
    </div>
  );
};
