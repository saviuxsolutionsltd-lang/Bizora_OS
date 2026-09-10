import React, { useState } from 'react';
import { User, Till } from '../types';
import { db } from '../services/db';
import { Lock, Unlock, KeyRound, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

interface IdleLockModalProps {
  isLocked: boolean;
  currentUser: User;
  currentTill: Till;
  onUnlock: (user: User) => void;
}

export const IdleLockModal: React.FC<IdleLockModalProps> = ({
  isLocked,
  currentUser,
  currentTill,
  onUnlock,
}) => {
  const [pin, setPin] = useState('');
  const [staffId, setStaffId] = useState(currentUser.staffId);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [newPin, setNewPin] = useState('');

  if (!isLocked) return null;

  const handleKeypadPress = (val: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + val);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleUnlockAttempt = () => {
    const users = db.getUsers();
    const user = users.find((u) => u.staffId === staffId.trim());

    if (!user) {
      setError('Staff ID not found in system.');
      return;
    }

    if (user.pin === pin) {
      db.setCurrentUser(user.id);
      db.addAuditLog({
        id: `AUD-UNLOCK-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'TILL_SCREEN_UNLOCKED',
        module: 'AUTHENTICATION',
        staffId: user.staffId,
        staffName: user.firstName,
        tillId: currentTill.id,
        details: `${user.firstName} unlocked ${currentTill.name}.`,
        severity: 'info',
        ipOrDevice: currentTill.name,
      });
      setPin('');
      setError(null);
      onUnlock(user);
    } else {
      setError('Invalid 6-digit PIN. Please try again.');
      db.addSecurityThreat({
        id: `THREAT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'FAILED_PIN_ATTEMPT',
        description: `Failed unlock attempt on ${currentTill.name} for Staff ID ${staffId}.`,
        severity: 'medium',
        resolved: false,
        ipOrDevice: currentTill.name,
      });
      setPin('');
    }
  };

  const handleDirectPinReset = () => {
    const users = db.getUsers();
    const user = users.find((u) => u.staffId === staffId.trim());

    if (!user) {
      setError('Staff member not found.');
      return;
    }

    // Owner and SuperAdmin can reset without external authorization
    if (user.role === 'owner' || user.role === 'superadmin') {
      if (newPin.length !== 6) {
        setError('New PIN must be exactly 6 digits.');
        return;
      }
      user.pin = newPin;
      db.saveUsers(users);
      setResetMessage(`PIN successfully updated for ${user.firstName} (${user.role.toUpperCase()}).`);
      setShowResetDialog(false);
      setNewPin('');
    } else {
      // Other staff: require owner authorization
      setResetMessage(`Authorization requested! Reset link queued to Business Owner for Staff ID ${staffId}.`);
      setShowResetDialog(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center p-8">
        {/* Till & Lock Indicator */}
        <div className="inline-flex p-4 bg-blue-50 text-blue-700 rounded-2xl mb-3 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-900">BizoraOS Terminal Locked</h2>
        <p className="text-xs text-slate-500 mt-1">
          Device Till: <strong className="text-slate-800">{currentTill.name}</strong>
        </p>

        {/* Staff ID Input */}
        <div className="mt-5 text-left">
          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
            4-Digit Staff ID
          </label>
          <input
            type="text"
            maxLength={4}
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="w-full px-3 py-2 text-center text-sm font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 bg-slate-50"
            placeholder="e.g. 1001"
          />
        </div>

        {/* PIN Circles Display */}
        <div className="mt-4">
          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
            Enter 6-Digit Staff PIN
          </label>
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  idx < pin.length
                    ? 'bg-blue-600 border-blue-600 scale-110'
                    : 'border-slate-300 bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center justify-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {resetMessage && (
          <div className="mt-3 p-2 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-center justify-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeypadPress(num)}
              className="h-12 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-base font-bold text-slate-800 transition active:scale-95 shadow-2xs"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition active:scale-95"
          >
            DEL
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="h-12 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-base font-bold text-slate-800 transition active:scale-95 shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            disabled={pin.length !== 6}
            onClick={handleUnlockAttempt}
            className={`h-12 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center ${
              pin.length === 6
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Unlock className="w-4 h-4" />
          </button>
        </div>

        {/* PIN Reset Quick Trigger */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowResetDialog(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3" />
            <span>Forgot or Reset PIN?</span>
          </button>
        </div>

        {/* Reset Dialog Modal */}
        {showResetDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl p-6 text-left max-w-xs w-full shadow-2xl space-y-3">
              <h4 className="font-bold text-sm text-slate-900">PIN Recovery & Reset</h4>
              <p className="text-xs text-slate-500">
                Owners & SuperAdmins can reset their PIN directly without external approval. Other staff
                generate an authorization link.
              </p>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">New 6-Digit PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="******"
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-center font-mono tracking-widest bg-slate-50"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetDialog(false)}
                  className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDirectPinReset}
                  className="flex-1 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-semibold"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
