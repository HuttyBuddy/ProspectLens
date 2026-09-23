import React, { useState } from 'react';
import { BusinessIdentity } from '../extractor/types';
import { ServiceOpportunity } from '../opportunities/opportunityTypes';
import {
  AdFormat,
  VideoDuration,
  generateAdConcept,
  AdConcept
} from './adConceptGenerator';
import { Button } from '../../shared/components/Button';
import { Video, Clapperboard, Copy, Check, Sparkles, Clock, Film, Lock, Crown } from 'lucide-react';

interface AdConceptPanelProps {
  identity: BusinessIdentity;
  opportunity?: ServiceOpportunity;
  isPro?: boolean;
  onOpenUpgradeModal?: (feature: string) => void;
}

export const AdConceptPanel: React.FC<AdConceptPanelProps> = ({
  identity,
  opportunity,
  isPro = false,
  onOpenUpgradeModal
}) => {
  const [format, setFormat] = useState<AdFormat>('Before & After');
  const [duration, setDuration] = useState<VideoDuration>('15s');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const formats: AdFormat[] = [
    'Before & After',
    'Cinematic',
    'High Stakes',
    'Problem → Solution',
    'Premium/Luxury',
    'Fast-Paced Social',
    'Testimonial',
    'Funny'
  ];

  const durations: VideoDuration[] = ['8s', '10s', '15s', '30s'];

  const concept: AdConcept = React.useMemo(() => {
    return generateAdConcept(identity, opportunity, format, duration);
  }, [identity, opportunity, format, duration]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(concept.generationPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Selector controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Video Format / Narrative Style:
          </label>
          <div className="flex flex-wrap gap-1">
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  format === f
                    ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-900'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Video Duration:</label>
          <div className="flex gap-1.5">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition cursor-pointer text-center ${
                  duration === d
                    ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-900'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ad Strategy Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-slate-800 pb-2">
          <Clapperboard className="w-3.5 h-3.5 text-cyan-400" />
          Ad Strategy & Positioning
        </div>
        <div className="space-y-1.5 text-xs">
          <div>
            <span className="font-semibold text-slate-300">Hook: </span>
            <span className="text-white italic">"{concept.strategy.hook}"</span>
          </div>
          <div>
            <span className="font-semibold text-slate-300">Target Audience: </span>
            <span className="text-slate-300">{concept.strategy.targetCustomer}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-300">Core Promise: </span>
            <span className="text-slate-300">{concept.strategy.corePromise}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-300">Direct CTA: </span>
            <span className="text-cyan-400 font-semibold">{concept.strategy.callToAction}</span>
          </div>
        </div>
      </div>

      {/* Shot List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            Shot List ({concept.shotList.length} Scenes)
          </span>
          <span className="text-[11px] text-cyan-400 font-medium">Total: {concept.duration}</span>
        </div>

        <div className="space-y-2.5">
          {/* Show first scene for free */}
          {concept.shotList.slice(0, 1).map((shot) => (
            <div key={shot.shotNumber} className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">
                  Scene {shot.shotNumber}: {shot.scene}
                </span>
                <span className="text-[11px] bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                  {shot.durationSeconds}s
                </span>
              </div>
              <p className="text-slate-200 mb-1">
                <span className="font-medium text-slate-400">Action: </span>
                {shot.action}
              </p>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <div>
                  <span className="font-medium text-slate-300">Camera: </span>
                  {shot.cameraMovement}
                </div>
                <div>
                  <span className="font-medium text-slate-300">Audio/SFX: </span>
                  {shot.soundSfx}
                </div>
              </div>
            </div>
          ))}

          {/* Remaining Scenes: Visible for Pro, Locked for Free */}
          {isPro ? (
            concept.shotList.slice(1).map((shot) => (
              <div key={shot.shotNumber} className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">
                    Scene {shot.shotNumber}: {shot.scene}
                  </span>
                  <span className="text-[11px] bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                    {shot.durationSeconds}s
                  </span>
                </div>
                <p className="text-slate-200 mb-1">
                  <span className="font-medium text-slate-400">Action: </span>
                  {shot.action}
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="font-medium text-slate-300">Camera: </span>
                    {shot.cameraMovement}
                  </div>
                  <div>
                    <span className="font-medium text-slate-300">Audio/SFX: </span>
                    {shot.soundSfx}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-blue-900/40 bg-slate-950/90 p-4 text-center space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-500/40 flex items-center justify-center text-cyan-400 mx-auto">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Scenes 2–4 Locked (Pro Feature)
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                  Upgrade to unlock complete camera movements, sound design cues, and closing CTA end-cards.
                </p>
              </div>
              <Button
                size="xs"
                variant="primary"
                className="cursor-pointer"
                onClick={() => onOpenUpgradeModal?.('Full Video Storyboard & Veo Prompts')}
              >
                <Crown className="w-3 h-3 mr-1 text-cyan-300" /> Unlock Storyboard ($49/mo)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Voiceover Script & End Card (Only shown if Pro) */}
      {isPro && (
        <>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2">
            <span className="text-xs font-bold text-white block border-b border-slate-800 pb-1.5">
              Suggested Voiceover Script
            </span>
            <div className="space-y-1.5 text-xs text-slate-200">
              {concept.voiceover.map((vo, idx) => (
                <p key={idx} className="bg-slate-950/80 p-2 rounded border border-slate-800/80 font-mono text-[11px] text-slate-200">
                  {vo}
                </p>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 text-white border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs shadow-md">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              Closing End-Card Screen
            </div>
            <div className="text-sm font-bold text-white">{concept.endCard.headline}</div>
            <div className="text-slate-300 text-xs">{concept.endCard.subheadline}</div>
            <div className="text-amber-400 font-semibold pt-1">{concept.endCard.callToAction}</div>
            <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
              {concept.endCard.contactInfo}
            </div>
          </div>
        </>
      )}

      {/* Generation Prompt for Google Flow / Veo */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Veo / Google Flow Generation Prompt
            {!isPro && (
              <span className="flex items-center gap-0.5 px-1 py-0.2 bg-blue-950/90 text-cyan-300 border border-blue-600/40 rounded text-[9px] font-bold">
                <Lock className="w-2 h-2" /> PRO
              </span>
            )}
          </span>
          {isPro ? (
            <Button
              size="xs"
              variant="outline"
              onClick={handleCopyPrompt}
              className="cursor-pointer"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400 mr-1" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" /> Copy Full Prompt
                </>
              )}
            </Button>
          ) : (
            <Button
              size="xs"
              variant="primary"
              onClick={() => onOpenUpgradeModal?.('Google Flow / Veo AI Video Prompt')}
              className="cursor-pointer text-[10px] py-0.5 px-2"
            >
              <Crown className="w-2.5 h-2.5 mr-1" /> Unlock Prompt
            </Button>
          )}
        </div>

        {isPro ? (
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-200 font-mono whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto select-text">
            {concept.generationPrompt}
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-3">
            <div className="filter blur-[3px] select-none text-[10px] text-slate-400 font-mono opacity-50">
              [Google Flow / Veo Text-To-Video Prompt]
              Cinematic 15s 4K vertical social commercial for {identity.businessName}...
              Narrative arc: 1. Hook: Outdated workflow... 2. Climax: Precision montage...
            </div>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] flex items-center justify-center p-2 text-center">
              <span className="text-[11px] text-cyan-300 font-medium">
                Production-ready text-to-video prompt locked on Free Plan.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
