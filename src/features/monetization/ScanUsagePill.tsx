import React from 'react';
import { UserLicenseState } from './types';
import { Zap, Crown, ArrowUpRight } from 'lucide-react';

interface ScanUsagePillProps {
  license: UserLicenseState;
  onOpenUpgradeModal: () => void;
}

export const ScanUsagePill: React.FC<ScanUsagePillProps> = ({
  license,
  onOpenUpgradeModal
}) => {
  if (license.isPro) {
    return (
      <button
        onClick={onOpenUpgradeModal}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-950/80 border border-blue-500/40 text-blue-300 hover:bg-blue-900/60 transition cursor-pointer text-[11px] font-medium shadow-xs"
        title="Active Subscription: Pro Plan. Click to manage plan."
      >
        <Crown className="w-3 h-3 text-cyan-400" />
        <span className="font-bold text-white tracking-tight">PRO</span>
        <span className="text-[10px] text-cyan-400">Unlimited</span>
      </button>
    );
  }

  const used = license.scansUsedThisMonth;
  const limit = license.scansMonthlyLimit;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = used >= limit - 2;

  return (
    <button
      onClick={onOpenUpgradeModal}
      className={`group flex items-center gap-2 px-2 py-1 rounded-md border transition cursor-pointer text-[11px] ${
        isNearLimit
          ? 'bg-amber-950/60 border-amber-500/40 text-amber-200 hover:bg-amber-900/50'
          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
      }`}
      title="Free Plan Scans. Click to unlock Unlimited Scans & Exports."
    >
      <div className="flex items-center gap-1">
        <Zap className={`w-3 h-3 ${isNearLimit ? 'text-amber-400' : 'text-cyan-400'}`} />
        <span>
          <strong className="text-white font-semibold">{used}</strong>
          <span className="text-slate-400">/{limit} scans</span>
        </span>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-10 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
        <div
          className={`h-full transition-all duration-300 ${
            isNearLimit ? 'bg-amber-400' : 'bg-cyan-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <span className="text-[10px] font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center">
        Upgrade
        <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
      </span>
    </button>
  );
};
