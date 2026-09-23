import React, { useState } from 'react';
import { SavedProspect } from '../pipeline/pipelineTypes';
import { ExportPreset, ExportFormat, EXPORT_PRESETS } from './types';
import { generateLeadsCsv, downloadExportFile } from './exportService';
import { UserSettings } from '../settings/settingsStore';
import {
  X,
  Download,
  FileSpreadsheet,
  Check,
  Sparkles,
  Lock,
  ArrowRight,
  Sliders,
  Mail,
  Table,
  Layers
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredProspects: SavedProspect[];
  allProspects: SavedProspect[];
  isPro?: boolean;
  settings?: UserSettings;
  onOpenUpgradeModal?: (feature: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  filteredProspects,
  allProspects,
  isPro = false,
  settings,
  onOpenUpgradeModal
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset>('instantly');
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPreset = EXPORT_PRESETS.find((p) => p.id === selectedPreset) || EXPORT_PRESETS[0];
  const targetProspects = scope === 'filtered' ? filteredProspects : allProspects;
  const leadCount = targetProspects.length;
  const exportLimitNotice = !isPro && leadCount > 3;

  const handleExport = () => {
    if (leadCount === 0) return;

    const filename = `prospectlens-${selectedPreset}-${new Date().toISOString().slice(0, 10)}.${format}`;
    const csvData = generateLeadsCsv(
      targetProspects,
      {
        preset: selectedPreset,
        format,
        scope
      },
      settings,
      isPro
    );

    downloadExportFile(csvData, filename, format);
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">Bulk Lead Exporter</h3>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded">
                  EXCEL & CSV
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Export verified prospects with computed audit scores & outreach copy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          
          {/* Preset Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Choose Export Template & Columns</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {EXPORT_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-blue-950/40 border-cyan-500/60 shadow-xs'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="pt-0.5">
                      {preset.id === 'instantly' ? (
                        <Mail className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                      ) : preset.id === 'full_audit' ? (
                        <Layers className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                      ) : (
                        <Table className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {preset.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                          preset.id === 'instantly'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {preset.description}
                      </p>
                      <p className="text-[10px] text-cyan-400/90 mt-1">
                        Best for: {preset.recommendedFor}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scope and Format row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                Export Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="filtered">
                  Filtered List ({filteredProspects.length} leads)
                </option>
                <option value="all">
                  All Saved Leads ({allProspects.length} leads)
                </option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="csv">CSV (Universal / Excel)</option>
                <option value="tsv">TSV (Tab-Separated)</option>
              </select>
            </div>
          </div>

          {/* Column Breakdown Preview */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Included Columns ({currentPreset.columns.length})</span>
              <span className="text-[10px] text-slate-400">RFC 4180 + UTF-8 BOM</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
              {currentPreset.columns.map((col) => (
                <span
                  key={col}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-mono"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Free Tier Notice */}
          {exportLimitNotice && (
            <div className="p-3 bg-blue-950/40 border border-blue-600/30 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Free Plan Limit: Exporting first 3 of {leadCount} leads</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Upgrade to Pro Solopreneur for unlimited bulk lead exports, 4-pillar audit scores, and ready-to-send cold outreach scripts.
              </p>
              <button
                type="button"
                onClick={() => onOpenUpgradeModal?.('Unlimited Bulk Lead & Audit Export')}
                className="w-full py-1.5 px-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlock Unlimited Pro Exports ($49/mo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={leadCount === 0 || downloadSuccess}
            onClick={handleExport}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md cursor-pointer ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : leadCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
            }`}
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Export Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  Export {isPro ? leadCount : Math.min(3, leadCount)} {leadCount === 1 ? 'Lead' : 'Leads'} to {format.toUpperCase()}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
