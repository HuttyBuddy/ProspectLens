import React, { useState } from 'react';
import { ShieldAlert, Lock, Unlock, Eye, EyeOff, X, AlertCircle } from 'lucide-react';
import { verifyAdminPasscode, setAdminAuthenticated } from './adminAuthService';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setErrorMsg('Please enter the admin master passcode.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const isValid = await verifyAdminPasscode(passcode);
      if (isValid) {
        await setAdminAuthenticated(true);
        setPasscode('');
        onAuthenticated();
      } else {
        setErrorMsg('Invalid admin passcode. Access denied and attempt logged.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                Admin Authentication
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono">RESTRICTED ACCESS</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <p className="text-slate-400 leading-relaxed">
            The Developer Sandbox and live diagnostic log streams are restricted to authorized administrators.
          </p>

          {errorMsg && (
            <div className="bg-rose-950/70 border border-rose-600/40 text-rose-300 rounded-lg p-2.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-[11px] leading-snug">{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
              Master Passcode
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter passcode..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg pl-3 pr-9 py-2 text-white placeholder-slate-500 focus:outline-none text-xs font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Initial default passcode: <span className="font-mono text-slate-400">admin2026</span>
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
            />
            <span>Remember session on this device</span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock Sandbox'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
