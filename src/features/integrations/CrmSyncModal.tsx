import React, { useState } from 'react';
import { SavedProspect } from '../pipeline/pipelineTypes';
import { UserSettings } from '../settings/settingsStore';
import { formatCrmPayload, sendProspectToWebhook } from './webhookService';
import { WebhookDeliveryResult } from './types';
import { Button } from '../../shared/components/Button';
import {
  X,
  Send,
  Zap,
  Lock,
  Crown,
  CheckCircle2,
  AlertTriangle,
  Code,
  ExternalLink,
  Settings as SettingsIcon,
  Globe
} from 'lucide-react';

interface CrmSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: SavedProspect | null;
  settings: UserSettings;
  isAgency: boolean;
  onOpenUpgradeModal: (featureContext?: string) => void;
  onSyncSuccess?: (prospectId: string) => void;
  onOpenSettings?: () => void;
}

export const CrmSyncModal: React.FC<CrmSyncModalProps> = ({
  isOpen,
  onClose,
  prospect,
  settings,
  isAgency,
  onOpenUpgradeModal,
  onSyncSuccess,
  onOpenSettings
}) => {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<WebhookDeliveryResult | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  if (!isOpen || !prospect) return null;

  let payloadPreview: any = null;
  try {
    payloadPreview = formatCrmPayload(prospect, settings);
  } catch (err: any) {
    payloadPreview = { error: err.message };
  }

  const handleSend = async () => {
    if (!isAgency) {
      onOpenUpgradeModal('Direct GoHighLevel & CRM Webhook Sync');
      return;
    }

    if (!settings.webhookUrl?.trim()) {
      setResult({
        success: false,
        message: 'No webhook URL configured. Please add your GoHighLevel or Zapier webhook in Settings.',
        timestamp: new Date().toISOString(),
        durationMs: 0
      });
      return;
    }

    setIsSending(true);
    setResult(null);

    const delivery = await sendProspectToWebhook(prospect, settings);
    setResult(delivery);
    setIsSending(false);

    if (delivery.success) {
      if (onSyncSuccess) {
        onSyncSuccess(prospect.id);
      }
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const platformName = settings.webhookPlatform === 'gohighlevel'
    ? 'GoHighLevel'
    : settings.webhookPlatform === 'hubspot'
    ? 'HubSpot'
    : settings.webhookPlatform === 'zapier'
    ? 'Zapier'
    : 'Webhook CRM';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 antialiased overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-4.5 space-y-4 my-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 pr-8">
          <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Send to {platformName}
              </h2>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                AGENCY SYNC
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Dispatch <span className="text-white font-semibold">{prospect.businessName}</span> directly into your automated CRM pipeline.
            </p>
          </div>
        </div>

        {/* Destination & Target Box */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Destination Webhook:</span>
            {settings.webhookUrl ? (
              <span className="text-cyan-400 font-mono text-[10px] truncate max-w-[200px]" title={settings.webhookUrl}>
                {settings.webhookUrl}
              </span>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings?.();
                }}
                className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer flex items-center gap-1"
              >
                <SettingsIcon className="w-3 h-3" /> Set in Settings
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/80">
            <div>
              <span className="text-slate-400 block text-[10px]">Contact Lead:</span>
              <span className="font-semibold text-white truncate block">
                {prospect.phone || prospect.email || prospect.businessName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Pitched Service:</span>
              <span className="font-semibold text-cyan-300 truncate block">
                {prospect.chosenService || 'Growth Audit'}
              </span>
            </div>
          </div>
        </div>

        {/* Payload Preview Toggle */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            {showJsonPreview ? 'Hide JSON Payload' : 'Preview JSON Payload (GoHighLevel/Zapier ready)'}
          </button>

          {showJsonPreview && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 max-h-40 overflow-y-auto">
              <pre className="text-[10px] font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(payloadPreview, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Result Alert */}
        {result && (
          <div
            className={`p-2.5 rounded-lg border text-xs font-medium flex items-start gap-2 ${
              result.success
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-snug">
              <span>{result.message}</span>
              {result.durationMs > 0 && (
                <span className="block text-[10px] opacity-80 mt-0.5">
                  Latency: {result.durationMs}ms
                </span>
              )}
            </div>
          </div>
        )}

        {/* Free / Pro Locked Overlay */}
        {!isAgency && (
          <div className="bg-gradient-to-b from-blue-950/50 to-slate-950/90 border border-blue-500/30 rounded-xl p-3.5 text-center space-y-2">
            <div className="w-7 h-7 rounded-full bg-blue-950 border border-blue-500/40 flex items-center justify-center text-cyan-400 mx-auto shadow-sm shadow-blue-900/40">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">
                Agency Growth Tier Feature
              </h3>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-0.5">
                Automatically push prospects, audit scorecards, and custom scripts into GoHighLevel, HubSpot, or Zapier workflows with the Agency Growth Plan.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="font-bold text-xs"
              onClick={() => onOpenUpgradeModal('Direct GoHighLevel & CRM Webhook Sync')}
            >
              <Crown className="w-3.5 h-3.5 mr-1.5 text-cyan-300" />
              Upgrade to Agency ($119/mo)
            </Button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          {isAgency ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              isLoading={isSending}
              className="font-bold shadow-md shadow-blue-900/40"
            >
              <Send className="w-3.5 h-3.5 mr-1 text-cyan-300" />
              Dispatch to CRM
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenUpgradeModal('Direct GoHighLevel & CRM Webhook Sync')}
              className="font-bold shadow-md shadow-blue-900/40"
            >
              <Lock className="w-3.5 h-3.5 mr-1 text-cyan-300" />
              Unlock Agency CRM Sync
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
