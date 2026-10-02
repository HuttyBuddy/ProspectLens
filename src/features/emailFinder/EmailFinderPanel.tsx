import React from 'react';
import { Mail, MailSearch, Copy, Check, ShieldCheck, Sparkles, AlertTriangle, Lock } from 'lucide-react';
import { WebsiteExtractionResult } from '../extractor/types';
import { VerifiedEmail, EmailConfidence } from './emailFinder';
import { runEmailFinder } from './emailFinderService';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';

interface EmailFinderPanelProps {
  extraction: WebsiteExtractionResult | null;
  onUpgrade: () => void;
}

const confidenceStyle: Record<EmailConfidence, { variant: 'success' | 'info' | 'warning'; icon: React.ReactNode }> = {
  Verified: { variant: 'success', icon: <ShieldCheck className="w-3 h-3" /> },
  Likely: { variant: 'info', icon: <Sparkles className="w-3 h-3" /> },
  Risky: { variant: 'warning', icon: <AlertTriangle className="w-3 h-3" /> }
};

const sourceLabel: Record<string, string> = {
  'on-page': 'On-page',
  'name-pattern': 'Pattern',
  'role-account': 'Role'
};

export const EmailFinderPanel: React.FC<EmailFinderPanelProps> = ({ extraction, onUpgrade }) => {
  const [emails, setEmails] = React.useState<VerifiedEmail[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [usage, setUsage] = React.useState<{ used: number; remaining: number; limit: number; tier: string } | null>(null);
  const [blockedReason, setBlockedReason] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const domain = extraction?.identity?.domain || '';

  const handleFind = async () => {
    if (!extraction) return;
    setLoading(true);
    setError(null);
    setBlockedReason(null);
    try {
      const result = await runEmailFinder(extraction);
      setUsage({ used: result.used, remaining: result.remaining, limit: result.limit, tier: result.tier });
      if (!result.allowed) {
        setBlockedReason(result.blockedReason || 'Limit reached.');
        setEmails([]);
      } else {
        setEmails(result.emails);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Email finder failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);
      setTimeout(() => setCopied((c) => (c === email ? null : c)), 1500);
    } catch {
      // Clipboard unavailable; ignore.
    }
  };

  if (!extraction) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 text-center">
        <MailSearch className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Run an audit first — the email finder works off the scanned prospect's domain.</p>
      </div>
    );
  }

  const verified = emails.filter((e) => e.confidence === 'Verified');
  const likely = emails.filter((e) => e.confidence === 'Likely');
  const risky = emails.filter((e) => e.confidence === 'Risky');

  return (
    <div className="space-y-3">
      {/* Header card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Email Finder</span>
          </div>
          {usage && (
            <span className="text-[11px] text-slate-400 font-medium">
              {usage.used} / {usage.limit} finds used
              <span className="text-slate-500"> · {usage.tier}</span>
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          Generates candidate addresses from on-page emails, name patterns, and role accounts, then verifies each
          domain with a DNS MX lookup. <span className="text-slate-300 font-medium">{domain}</span>
        </p>
        <Button onClick={handleFind} isLoading={loading} disabled={loading} className="w-full">
          <MailSearch className="w-4 h-4" />
          {emails.length > 0 ? 'Re-run Email Finder' : 'Find Emails'}
        </Button>
        {blockedReason && (
          <div className="mt-3 bg-amber-950/60 border border-amber-700/50 rounded-lg p-2.5 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-200">
              <p className="font-semibold mb-1">{blockedReason}</p>
              <button onClick={onUpgrade} className="text-amber-300 underline font-medium cursor-pointer">
                Upgrade for more finds
              </button>
            </div>
          </div>
        )}
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      </div>

      {/* Results */}
      {emails.length > 0 && (
        <div className="space-y-2">
          {[
            { title: `Verified (${verified.length})`, list: verified },
            { title: `Likely (${likely.length})`, list: likely },
            { title: `Risky (${risky.length})`, list: risky }
          ].map(
            (group) =>
              group.list.length > 0 && (
                <div key={group.title}>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    {group.title}
                  </p>
                  <div className="space-y-1.5">
                    {group.list.map((e) => {
                      const style = confidenceStyle[e.confidence];
                      return (
                        <div
                          key={e.email}
                          className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 flex items-center gap-2 hover:border-slate-700 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-white font-mono truncate">{e.email}</span>
                              <Badge variant={style.variant} className="font-semibold">
                                {style.icon} {e.confidence}
                              </Badge>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                                {sourceLabel[e.source] || e.source}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug" title={e.reason}>
                              {e.reason}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopy(e.email)}
                            className="shrink-0 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Copy email"
                          >
                            {copied === e.email ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
};
