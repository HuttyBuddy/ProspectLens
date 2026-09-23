import React, { useState } from 'react';
import { UserSettings, DEFAULT_SERVICES, saveUserSettings } from './settingsStore';
import { UserLicenseState } from '../monetization/types';
import { openBillingPortal, syncPaymentStatus } from '../monetization/paymentService';
import { Button } from '../../shared/components/Button';
import {
  Check,
  Plus,
  Trash2,
  Sliders,
  Briefcase,
  DollarSign,
  MessageSquare,
  Crown,
  Zap,
  RefreshCw,
  ExternalLink,
  Send,
  ShieldCheck
} from 'lucide-react';

interface SettingsPanelProps {
  settings: UserSettings;
  onSave: (updated: UserSettings) => void;
  license?: UserLicenseState;
  onOpenUpgradeModal?: (feature?: string) => void;
  onLicenseUpdated?: (updated: UserLicenseState) => void;
  onOpenAdminPanel?: () => void;
  isAdminAuthenticated?: boolean;
  onOpenAdminAuth?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSave,
  license,
  onOpenUpgradeModal,
  onLicenseUpdated,
  onOpenAdminPanel,
  isAdminAuthenticated = false,
  onOpenAdminAuth
}) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [newServiceInput, setNewServiceInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncPayment = async () => {
    setIsSyncing(true);
    try {
      const result = await syncPaymentStatus();
      if (result.updatedLicense && onLicenseUpdated) {
        onLicenseUpdated(result.updatedLicense);
      }
      if (result.paid) {
        setSyncFeedback(`Active ${result.tier.toUpperCase()} subscription verified!`);
      } else {
        setSyncFeedback('Account verified: on Free plan.');
      }
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err) {
      setSyncFeedback('Could not check Stripe status.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    await openBillingPortal();
  };

  const toggleService = (svc: string) => {
    const isChecked = form.servicesSold.includes(svc);
    const updated = isChecked
      ? form.servicesSold.filter((s) => s !== svc)
      : [...form.servicesSold, svc];
    setForm({ ...form, servicesSold: updated });
  };

  const handleAddCustomService = () => {
    const trimmed = newServiceInput.trim();
    if (trimmed && !form.servicesSold.includes(trimmed)) {
      setForm({
        ...form,
        servicesSold: [...form.servicesSold, trimmed],
        customServices: [...(form.customServices || []), trimmed]
      });
      setNewServiceInput('');
    }
  };

  const handlePriceChange = (service: string, price: string) => {
    setForm({
      ...form,
      customPricing: {
        ...form.customPricing,
        [service]: price
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveUserSettings(form);
    onSave(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Subscription & Plan Status */}
      {license && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Crown className="w-3.5 h-3.5 text-cyan-400" />
              Plan & Subscription
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              license.isPro ? 'bg-blue-950 text-cyan-300 border border-blue-500/40' : 'bg-slate-800 text-slate-300'
            }`}>
              {license.tier.toUpperCase()} PLAN
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Monthly Scans:</span>
            <span className="font-semibold text-white">
              {license.isPro ? 'Unlimited' : `${license.scansUsedThisMonth} / ${license.scansMonthlyLimit} used`}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Pipeline Storage:</span>
            <span className="font-semibold text-white">
              {license.isPro ? 'Unlimited' : `Up to ${license.savedProspectsLimit} prospects`}
            </span>
          </div>

          {syncFeedback && (
            <div className="p-2 rounded bg-blue-950/80 border border-blue-500/30 text-cyan-300 text-[11px] text-center">
              {syncFeedback}
            </div>
          )}

          <div className="pt-1 space-y-1.5">
            {license.isPro ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleOpenBillingPortal}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-blue-900/30"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-200" />
                  Manage Stripe Billing
                </button>
                <button
                  type="button"
                  onClick={() => onOpenUpgradeModal?.()}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                >
                  Change Plan
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenUpgradeModal?.()}
                className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-blue-900/30"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-300" />
                Upgrade to Pro ($49/mo)
              </button>
            )}

            <button
              type="button"
              onClick={handleSyncPayment}
              disabled={isSyncing}
              className="w-full py-1 px-2 rounded bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-slate-200 text-[10px] transition cursor-pointer flex items-center justify-center gap-1 border border-slate-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-2.5 h-2.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Stripe Status
            </button>
          </div>
        </div>
      )}

      {/* Services They Sell */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-slate-800 pb-2">
          <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
          Services You Sell & Prioritize
        </div>
        <p className="text-[11px] text-slate-400">
          The opportunity engine prioritizes services checked here in "What Should I Sell Them?".
        </p>

        <div className="space-y-1.5">
          {Array.from(new Set([...DEFAULT_SERVICES, ...(form.customServices || [])])).map((svc) => (
            <label
              key={svc}
              className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white"
            >
              <input
                type="checkbox"
                checked={form.servicesSold.includes(svc)}
                onChange={() => toggleService(svc)}
                className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-400 cursor-pointer"
              />
              <span className="font-medium">{svc}</span>
            </label>
          ))}
        </div>

        {/* Add custom service */}
        <div className="flex gap-1.5 pt-1">
          <input
            type="text"
            placeholder="Add custom service (e.g. Chatbot)..."
            value={newServiceInput}
            onChange={(e) => setNewServiceInput(e.target.value)}
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={handleAddCustomService}
          >
            <Plus className="w-3 h-3 mr-0.5" /> Add
          </Button>
        </div>
      </div>

      {/* Your Business Info */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-slate-800 pb-2">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Your Sender Profile
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Your Name</label>
            <input
              type="text"
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Company Name</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Outreach Preferences */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-slate-800 pb-2">
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          Outreach Preferences
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Default Call-To-Action</label>
          <input
            type="text"
            value={form.defaultCta}
            onChange={(e) => setForm({ ...form, defaultCta: e.target.value })}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Preferred Tone</label>
            <select
              value={form.preferredTone}
              onChange={(e) => setForm({ ...form, preferredTone: e.target.value as any })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Direct" className="bg-slate-900 text-white">Direct</option>
              <option value="Friendly" className="bg-slate-900 text-white">Friendly</option>
              <option value="Professional" className="bg-slate-900 text-white">Professional</option>
              <option value="Casual" className="bg-slate-900 text-white">Casual</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Length</label>
            <select
              value={form.preferredLength}
              onChange={(e) => setForm({ ...form, preferredLength: e.target.value as any })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="concise" className="bg-slate-900 text-white">Concise (Under 100 words)</option>
              <option value="standard" className="bg-slate-900 text-white">Standard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Custom Starting Prices */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-slate-800 pb-2">
          <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
          Custom Starting Pricing (Optional)
        </div>
        <p className="text-[11px] text-slate-400">
          Configure baseline pricing guide shown under opportunity cards.
        </p>

        {form.servicesSold.slice(0, 4).map((svc) => (
          <div key={svc} className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-200 font-medium truncate">{svc}</span>
            <input
              type="text"
              placeholder="e.g. $1,500"
              value={form.customPricing[svc] || ''}
              onChange={(e) => handlePriceChange(svc, e.target.value)}
              className="w-32 bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-right text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {/* CRM & Webhook Integration (GoHighLevel / Zapier / HubSpot) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            CRM & Webhook Sync
          </div>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            AGENCY TIER
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Automatically push prospects, audit scorecards, and pitch copy into GoHighLevel, Zapier, or HubSpot.
        </p>

        <div className="space-y-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Platform Preset</label>
            <select
              value={form.webhookPlatform || 'gohighlevel'}
              onChange={(e) => setForm({ ...form, webhookPlatform: e.target.value as any })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="gohighlevel" className="bg-slate-900 text-white">GoHighLevel (Inbound Webhook)</option>
              <option value="zapier" className="bg-slate-900 text-white">Zapier (Catch Hook)</option>
              <option value="hubspot" className="bg-slate-900 text-white">HubSpot / Make.com</option>
              <option value="generic" className="bg-slate-900 text-white">Custom JSON Webhook Endpoint</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Webhook URL</label>
            <input
              type="url"
              placeholder="https://services.leadconnectorhq.com/hooks/..."
              value={form.webhookUrl || ''}
              onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
              Authorization Header (Optional)
            </label>
            <input
              type="text"
              placeholder="Bearer your-api-key-here"
              value={form.webhookAuthHeader || ''}
              onChange={(e) => setForm({ ...form, webhookAuthHeader: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
            />
          </div>
        </div>
      </div>

      {/* Developer & Admin Sandbox Card (Gated to Authenticated Admins Only) */}
      {isAdminAuthenticated ? (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Developer & Admin Sandbox
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              AUTHENTICATED
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Simulate Free, Pro, and Agency tiers, reset scan counts, test premium deliverables, and inspect live diagnostic error logs.
          </p>
          <button
            type="button"
            onClick={() => onOpenAdminPanel?.()}
            className="w-full py-1.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Launch Admin Sandbox & Diagnostics</span>
          </button>
        </div>
      ) : (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => onOpenAdminAuth?.()}
            className="text-[11px] text-slate-600 hover:text-slate-400 flex items-center gap-1 transition cursor-pointer"
            title="Authenticate with Master Passcode"
          >
            <ShieldCheck className="w-3 h-3 text-slate-600" />
            <span>Admin Sign In</span>
          </button>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-2">
        <Button type="submit" variant="primary" size="md" className="w-full">
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300 mr-1" /> Settings Saved!
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </form>
  );
};
