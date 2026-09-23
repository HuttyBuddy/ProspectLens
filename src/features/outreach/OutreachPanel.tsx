import React, { useState } from 'react';
import { BusinessIdentity } from '../extractor/types';
import { ServiceOpportunity } from '../opportunities/opportunityTypes';
import { UserSettings } from '../settings/settingsStore';
import {
  generatePersonalizedOutreach,
  OutreachChannel,
  OutreachTone,
  OutreachMessage
} from './outreachGenerator';
import { Button } from '../../shared/components/Button';
import { Copy, Check, RefreshCw, Send, Sparkles, Lock } from 'lucide-react';

interface OutreachPanelProps {
  identity: BusinessIdentity;
  opportunities: ServiceOpportunity[];
  selectedOpportunity?: ServiceOpportunity;
  userSettings: UserSettings;
  onSaveMessage?: (msg: OutreachMessage) => void;
  isPro?: boolean;
  onOpenUpgradeModal?: (feature: string) => void;
}

export const OutreachPanel: React.FC<OutreachPanelProps> = ({
  identity,
  opportunities,
  selectedOpportunity,
  userSettings,
  onSaveMessage,
  isPro = false,
  onOpenUpgradeModal
}) => {
  const [channel, setChannel] = useState<OutreachChannel>('Email');
  const [tone, setTone] = useState<OutreachTone>(userSettings.preferredTone || 'Direct');
  const [activeOpp, setActiveOpp] = useState<ServiceOpportunity>(
    selectedOpportunity || opportunities[0]
  );
  const [customCta, setCustomCta] = useState<string>(userSettings.defaultCta || '');
  const [variantModifier, setVariantModifier] = useState<'default' | 'shorter' | 'more_casual' | 'more_direct'>('default');
  const [copied, setCopied] = useState(false);

  // Sync if prop changes
  React.useEffect(() => {
    if (selectedOpportunity) {
      setActiveOpp(selectedOpportunity);
    }
  }, [selectedOpportunity]);

  const currentMessage = React.useMemo(() => {
    if (!activeOpp) return null;
    return generatePersonalizedOutreach({
      channel,
      tone,
      opportunity: activeOpp,
      identity,
      senderName: userSettings.userName,
      senderCompany: userSettings.companyName,
      customCta: customCta.trim() || undefined,
      variantModifier
    });
  }, [channel, tone, activeOpp, identity, userSettings, customCta, variantModifier]);

  const handleCopy = () => {
    if (!currentMessage) return;
    const fullText = currentMessage.subject
      ? `Subject: ${currentMessage.subject}\n\n${currentMessage.body}`
      : currentMessage.body;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onSaveMessage) onSaveMessage(currentMessage);
  };

  const channels: { id: OutreachChannel; label: string }[] = [
    { id: 'Email', label: 'Email' },
    { id: 'DM', label: 'Instagram / FB DM' },
    { id: 'LinkedIn', label: 'LinkedIn' },
    { id: 'SMS', label: 'SMS' },
    { id: 'ColdCall', label: 'Cold-call Opener' }
  ];

  const tones: OutreachTone[] = ['Direct', 'Friendly', 'Professional', 'Casual'];

  return (
    <div className="space-y-4">
      {/* Target Service Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Pitching Opportunity:
        </label>
        <select
          value={activeOpp?.id || ''}
          onChange={(e) => {
            const found = opportunities.find((o) => o.id === e.target.value);
            if (found) {
              setActiveOpp(found);
              setVariantModifier('default');
            }
          }}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {opportunities.map((opp) => (
            <option key={opp.id} value={opp.id} className="bg-slate-900 text-white">
              {opp.service} ({opp.confidence} Conf.)
            </option>
          ))}
        </select>
      </div>

      {/* Channel Pills */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Outreach Channel:</label>
        <div className="flex flex-wrap gap-1.5">
          {channels.map((ch) => {
            const isGated = ch.id !== 'Email' && !isPro;
            return (
              <button
                key={ch.id}
                onClick={() => {
                  if (isGated) {
                    onOpenUpgradeModal?.(`${ch.label} Multi-Channel Scripts`);
                    return;
                  }
                  setChannel(ch.id);
                  setVariantModifier('default');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  channel === ch.id
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-900 font-semibold'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{ch.label}</span>
                {isGated && (
                  <span className="flex items-center gap-0.5 px-1 py-0.2 bg-blue-950/90 text-cyan-300 border border-blue-600/40 rounded text-[9px] font-bold">
                    <Lock className="w-2 h-2" /> PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone Pills */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Tone:</label>
        <div className="flex gap-1.5">
          {tones.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTone(t);
                setVariantModifier('default');
              }}
              className={`flex-1 py-1 rounded-md text-xs font-medium transition cursor-pointer text-center ${
                tone === t
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-900 font-semibold'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Message Box */}
      {currentMessage && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2.5">
          {currentMessage.subject && (
            <div className="pb-2 border-b border-slate-800">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                Subject line
              </span>
              <p className="text-xs font-semibold text-white mt-0.5 select-text">
                {currentMessage.subject}
              </p>
            </div>
          )}

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Message Preview ({currentMessage.charCount} chars)
            </span>
            <div className="text-xs text-slate-100 whitespace-pre-line leading-relaxed font-normal bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 select-text">
              {currentMessage.body}
            </div>
          </div>

          {/* Quick Modifier Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Adjust:</span>
            <button
              onClick={() => setVariantModifier('shorter')}
              className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer ${
                variantModifier === 'shorter'
                  ? 'bg-blue-950/90 border-blue-500/50 text-blue-300 font-semibold'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Shorter
            </button>
            <button
              onClick={() => setVariantModifier('more_casual')}
              className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer ${
                variantModifier === 'more_casual'
                  ? 'bg-blue-950/90 border-blue-500/50 text-blue-300 font-semibold'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              More Casual
            </button>
            <button
              onClick={() => setVariantModifier('more_direct')}
              className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer ${
                variantModifier === 'more_direct'
                  ? 'bg-blue-950/90 border-blue-500/50 text-blue-300 font-semibold'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              More Direct
            </button>
            {variantModifier !== 'default' && (
              <button
                onClick={() => setVariantModifier('default')}
                className="text-[11px] text-slate-400 hover:text-slate-200 ml-auto cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300 mr-1" /> Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Message
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVariantModifier('default')}
              title="Regenerate"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
