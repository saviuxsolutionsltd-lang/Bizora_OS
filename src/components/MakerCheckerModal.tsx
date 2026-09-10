import React, { useState } from 'react';
import { User } from '../types';
import { makerChecker, MakerCheckerRequest, MakerCheckerOperationType } from '../services/makerChecker';
import { ShieldAlert, CheckCircle2, XCircle, KeyRound, Clock, UserCheck, AlertTriangle, X } from 'lucide-react';

interface MakerCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Direct instant approval mode:
  directOperation?: {
    operation: MakerCheckerOperationType;
    title: string;
    description: string;
    details: string;
    onApproved: () => void;
  };
  currentUser: User;
  users: User[];
  onQueueUpdated?: () => void;
}

export const MakerCheckerModal: React.FC<MakerCheckerModalProps> = ({
  isOpen,
  onClose,
  directOperation,
  currentUser,
  users,
  onQueueUpdated,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'direct' | 'pending'>(directOperation ? 'direct' : 'pending');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const pendingRequests = makerChecker.getPendingRequests();

  if (!isOpen) return null;

  const handleDirectApprove = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!directOperation) return;

    const res = makerChecker.directAuthorize(
      directOperation.operation,
      directOperation.title,
      pin,
      currentUser,
      users,
      directOperation.details
    );

    if (!res.authorized) {
      setErrorMsg(res.error || 'Authorization failed.');
      return;
    }

    setSuccessMsg(`Authorized by ${res.supervisor?.firstName} (${res.supervisor?.role.toUpperCase()})`);
    setTimeout(() => {
      directOperation.onApproved();
      onClose();
      if (onQueueUpdated) onQueueUpdated();
    }, 600);
  };

  const handleApproveQueueItem = (req: MakerCheckerRequest) => {
    setErrorMsg('');
    if (!pin) {
      setErrorMsg('Please enter your 6-digit Supervisor PIN below.');
      return;
    }

    const res = makerChecker.approveRequest(req.id, currentUser, pin, users);
    if (!res.success) {
      setErrorMsg(res.error || 'Approval failed.');
      return;
    }

    setSuccessMsg(`Approved request #${req.id} successfully!`);
    setPin('');
    if (onQueueUpdated) onQueueUpdated();
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleRejectQueueItem = (reqId: string) => {
    const res = makerChecker.rejectRequest(reqId, currentUser, rejectReason || 'Rejected by supervisor');
    if (res.success) {
      setRejectingId(null);
      setRejectReason('');
      if (onQueueUpdated) onQueueUpdated();
    } else {
      setErrorMsg(res.error || 'Rejection failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header - Solid Navy #101f42 (No Gradient) */}
        <div className="bg-[#101f42] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f59e0b] flex items-center justify-center text-slate-900 font-bold">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-white">
                Maker-Checker Authorization
              </h3>
              <p className="text-xs text-slate-300">
                Dual-Control Supervisor Sign-off & Audit Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher if both available */}
        {directOperation && pendingRequests.length > 0 && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`pb-2 px-4 text-xs font-bold border-b-2 transition ${
                activeTab === 'direct'
                  ? 'border-[#101f42] text-[#101f42]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Current Authorization
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`pb-2 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'border-[#101f42] text-[#101f42]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Pending Approvals</span>
              <span className="bg-[#f59e0b] text-slate-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {pendingRequests.length}
              </span>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode 1: Direct Instant Supervisor Sign-off */}
          {activeTab === 'direct' && directOperation && (
            <form onSubmit={handleDirectApprove} className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Sensitive Action
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Initiator: {currentUser.firstName} ({currentUser.role})
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900">
                  {directOperation.title}
                </div>
                <p className="text-xs text-slate-600">
                  {directOperation.description}
                </p>
                {directOperation.details && (
                  <div className="text-[11px] font-mono bg-white p-2 rounded border border-slate-200 text-slate-700">
                    {directOperation.details}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Enter Supervisor 6-Digit PIN (Owner, SuperAdmin or Manager):
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    autoFocus
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-[#101f42] focus:border-transparent outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Default supervisor credentials available: Owner PIN <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">123456</code> or Manager PIN <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">234567</code>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pin.length < 4}
                  className="px-5 py-2.5 bg-[#101f42] hover:bg-[#1a2b6b] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Verify & Authorize</span>
                </button>
              </div>
            </form>
          )}

          {/* Mode 2: Pending Approvals Queue */}
          {(activeTab === 'pending' || !directOperation) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700">
                  Pending Supervisor Requests ({pendingRequests.length})
                </div>
                <div className="text-[11px] text-slate-500">
                  Supervisor: {currentUser.firstName} ({currentUser.role})
                </div>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Pending Requests</p>
                  <p className="text-[11px] text-slate-500">All sensitive operations have been approved or processed.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#101f42] bg-blue-100/70 px-2 py-0.5 rounded text-[10px]">
                          {req.id} • {req.operation}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(req.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">{req.title}</div>
                      <p className="text-slate-600 text-[11px]">{req.description}</p>
                      <div className="text-[10px] text-slate-500">
                        Maker: <span className="font-semibold text-slate-700">{req.makerStaffName}</span> ({req.makerRole}) • Till: {req.makerTillId}
                      </div>

                      {rejectingId === req.id ? (
                        <div className="pt-2 space-y-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="State reason for rejection..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg outline-none"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setRejectingId(null)}
                              className="text-[11px] text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectQueueItem(req.id)}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px]"
                            >
                              Confirm Rejection
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => setRejectingId(req.id)}
                            className="px-3 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-[11px]"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveQueueItem(req)}
                            className="px-3 py-1 bg-[#101f42] hover:bg-[#1a2b6b] text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Approve & Execute</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Supervisor PIN input for queue approval */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Your Supervisor 6-Digit PIN to approve selected request:
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit PIN (e.g. 123456)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono tracking-wider outline-none focus:ring-2 focus:ring-[#101f42]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
