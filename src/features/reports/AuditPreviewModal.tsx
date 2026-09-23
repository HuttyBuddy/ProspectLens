import React, { useState } from 'react';
import { ClientAuditData } from './types';
import { generateClientAuditPdf } from './auditPdfGenerator';
import { Button } from '../../shared/components/Button';
import {
  X,
  FileText,
  Download,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Crown,
  Briefcase
} from 'lucide-react';

interface AuditPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditData: ClientAuditData | null;
  isPro: boolean;
  onOpenUpgradeModal: (featureContext?: string) => void;
}

export const AuditPreviewModal: React.FC<AuditPreviewModalProps> = ({
  isOpen,
  onClose,
  auditData,
  isPro,
  onOpenUpgradeModal
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !auditData) return null;

  const handleDownload = () => {
    if (!isPro) {
      onOpenUpgradeModal('Client Audit PDF Reports');
      return;
    }

    setIsDownloading(true);
    try {
      generateClientAuditPdf(auditData);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 antialiased overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-4.5 space-y-4 my-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 pr-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Client Marketing & Conversion Audit
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-950 text-cyan-300 border border-blue-500/30">
                  A4 / 1-PAGE PDF
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Prepared for <span className="text-white font-semibold">{auditData.businessName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Audit Document Preview Container */}
        <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-3.5 space-y-3.5 relative overflow-hidden">
          {/* Document Top Bar */}
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                {auditData.agency.name}
              </span>
              <span className="text-xs font-bold text-white block">
                Growth Audit: {auditData.businessName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">{auditData.generatedDate}</span>
              <span className="text-[10px] text-slate-300 truncate max-w-[140px] block">
                {auditData.websiteUrl.replace(/^https?:\/\//, '')}
              </span>
            </div>
          </div>

          {/* Health Index Scorecard */}
          <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800/60 rounded-lg p-2.5">
            <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0">
              <span className="text-xl font-black text-cyan-400">{auditData.overallScore}</span>
              <span className="text-[8px] text-slate-400 uppercase font-bold">OUT OF 100</span>
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-xs font-bold text-white block">
                Overall Digital Conversion Index
              </span>
              <p className="text-[10px] text-slate-400 leading-snug">
                Identifies high-impact digital levers to increase inbound quote requests and conversion velocity.
              </p>
            </div>
          </div>

          {/* 4 Pillars Preview */}
          <div className="grid grid-cols-2 gap-2">
            {auditData.categoryScores.map((cat) => (
              <div key={cat.category} className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
                  <span>{cat.category}</span>
                  <span className={cat.score >= 70 ? 'text-emerald-400' : cat.score >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                    {cat.score}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cat.score >= 70 ? 'bg-emerald-400' : cat.score >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottlenecks & Roadmap Preview (Blurred if not Pro) */}
          <div className={`space-y-2.5 ${!isPro ? 'filter blur-[2px] opacity-40 select-none' : ''}`}>
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                Detected Conversion Bottlenecks
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {auditData.detectedBottlenecks.slice(0, 2).map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                Recommended Pitch Roadmap
              </span>
              <div className="space-y-1.5">
                {auditData.recommendedServices.slice(0, 2).map((s, i) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-800/60 rounded p-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-200">{s.title}</span>
                    <span className="text-[9px] font-bold text-cyan-300 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-500/30">
                      {s.priority} Priority
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Locked Paywall Overlay for Free Tier */}
          {!isPro && (
            <div className="absolute inset-x-0 bottom-0 top-[170px] bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2 rounded-b-xl border-t border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-blue-900/40">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">
                  Unlock Full 1-Page Client Audit PDF
                </h3>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-0.5">
                  Hand clients an objective, beautifully branded conversion audit to close $2,000–$5,000 service retainers.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="font-bold text-xs"
                onClick={() => onOpenUpgradeModal('Client Audit PDF Reports')}
              >
                <Crown className="w-3.5 h-3.5 mr-1.5 text-cyan-300" />
                Upgrade to Download Report
              </Button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>Branded with your agency info from Settings</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>

            {isPro ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownload}
                isLoading={isDownloading}
                className="font-bold shadow-md shadow-blue-900/40"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-300" /> Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1 text-cyan-300" /> Download PDF Report
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenUpgradeModal('Client Audit PDF Reports')}
                className="font-bold shadow-md shadow-blue-900/40"
              >
                <Lock className="w-3.5 h-3.5 mr-1 text-cyan-300" /> Unlock PDF Download
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
