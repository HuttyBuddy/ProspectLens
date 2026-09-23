import React, { useState } from 'react';
import { UserLicenseState, SubscriptionTier } from './types';
import { setSubscriptionTier, resetUsage } from './licenseStore';
import { openStripeCheckout, syncPaymentStatus, openBillingPortal } from './paymentService';
import { Button } from '../../shared/components/Button';
import {
  X,
  Check,
  Zap,
  Sparkles,
  Building,
  Crown,
  CreditCard,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: UserLicenseState;
  onLicenseUpdated: (updated: UserLicenseState) => void;
  featureContext?: string; // Optional context: e.g. "Export CSV", "Full Veo Prompts", etc.
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  license,
  onLicenseUpdated,
  featureContext
}) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    license.tier === 'free' ? 'pro' : license.tier
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  if (!isOpen) return null;

  // Real Stripe Checkout via ExtensionPay
  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    setStatusMessage({
      text: 'Opening secure Stripe checkout...',
      type: 'info'
    });

    try {
      const planToPay = selectedTier === 'agency' ? 'agency' : 'pro';
      await openStripeCheckout(planToPay);
      setStatusMessage({
        text: 'Stripe checkout opened in a new tab! Once completed, click "Check Payment Status" below.',
        type: 'info'
      });
    } catch (err) {
      setStatusMessage({
        text: 'Could not open checkout page. Try checking your internet or popup permissions.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Sync payment state from Stripe/ExtPay
  const handleSyncPayment = async () => {
    setIsSyncing(true);
    try {
      const result = await syncPaymentStatus();
      if (result.paid && result.updatedLicense) {
        onLicenseUpdated(result.updatedLicense);
        setStatusMessage({
          text: `Payment verified! You are now upgraded to ${result.tier.toUpperCase()}.`,
          type: 'success'
        });
        setTimeout(() => {
          setStatusMessage(null);
          onClose();
        }, 1500);
      } else {
        setStatusMessage({
          text: 'No active Stripe payment detected yet. If you recently paid, wait a moment and try again.',
          type: 'info'
        });
      }
    } catch (err) {
      setStatusMessage({
        text: 'Error checking payment status.',
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Stripe customer portal
  const handleOpenBilling = async () => {
    await openBillingPortal();
  };

  // Simulated instant tier activation for development / demo testing
  const handleApplySimulatedTier = async (tier: SubscriptionTier) => {
    setIsProcessing(true);
    const updated = await setSubscriptionTier(tier);
    onLicenseUpdated(updated);
    setIsProcessing(false);
    setStatusMessage({
      text: `Dev Mode: Switched to ${tier.toUpperCase()} plan!`,
      type: 'success'
    });
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 1200);
  };

  const handleResetScans = async () => {
    const updated = await resetUsage();
    onLicenseUpdated(updated);
    setStatusMessage({
      text: 'Reset scan counter to 0 for testing.',
      type: 'success'
    });
    setTimeout(() => setStatusMessage(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3.5 antialiased overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-4.5 space-y-4 my-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-cyan-300 text-[11px] font-semibold mb-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Supercharge Your Agency Pipeline
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            {featureContext ? `Unlock ${featureContext} with Pro` : 'Upgrade to ProspectLens Pro'}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Close high-ticket retainer and video clients faster with unlimited scans, full video prompts, and CRM export.
          </p>
        </div>

        {/* Pricing Tier Selector Cards */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Pro Card */}
          <div
            onClick={() => setSelectedTier('pro')}
            className={`p-3 rounded-xl border transition cursor-pointer relative ${
              selectedTier === 'pro'
                ? 'bg-blue-950/40 border-blue-500 shadow-sm shadow-blue-900/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="absolute -top-2 right-3 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pro Solopreneur</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-lg font-black text-white">$49</span>
              <span className="text-[10px] text-slate-400">/ month</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                <span><strong>Unlimited</strong> website scans</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Full Google Flow / Veo prompts</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>1-Click <strong>CSV & CRM Export</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>SMS, Cold Call & LinkedIn scripts</span>
              </li>
            </ul>
          </div>

          {/* Agency Card */}
          <div
            onClick={() => setSelectedTier('agency')}
            className={`p-3 rounded-xl border transition cursor-pointer relative ${
              selectedTier === 'agency'
                ? 'bg-cyan-950/40 border-cyan-500 shadow-sm shadow-cyan-900/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>Agency Growth</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-lg font-black text-white">$119</span>
              <span className="text-[10px] text-slate-400">/ month</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Everything in Pro plan</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                <span><strong>3 Team Member Seats</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Direct GoHighLevel sync</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Client-Ready PDF Audits</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-2.5 rounded-lg border text-xs text-center font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-red-950/80 border-red-500/40 text-red-300'
                : 'bg-blue-950/80 border-blue-500/40 text-blue-300'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Live Stripe Checkout & Actions */}
        <div className="space-y-2 pt-1">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center font-bold text-xs py-2.5 shadow-md shadow-blue-900/40"
            onClick={handleStripeCheckout}
            isLoading={isProcessing}
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5 text-cyan-300" />
            Checkout with Stripe ({selectedTier === 'agency' ? '$119/mo' : '$49/mo'})
          </Button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSyncPayment}
              disabled={isSyncing}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              Check Stripe Status
            </button>

            {license.isPro && (
              <button
                type="button"
                onClick={handleOpenBilling}
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <ExternalLink className="w-3 h-3 text-cyan-400" />
                Manage Billing in Stripe
              </button>
            )}
          </div>

          {/* Dev Simulation Bar */}
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400">Developer Testing Controls:</span>
              <button
                onClick={() => handleApplySimulatedTier(selectedTier)}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer font-medium"
              >
                Instant Simulated {selectedTier.toUpperCase()}
              </button>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <button
                onClick={() => handleApplySimulatedTier('free')}
                className="text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset to Free Plan
              </button>
              <span>•</span>
              <button
                onClick={handleResetScans}
                className="text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset Scans (0/10)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
