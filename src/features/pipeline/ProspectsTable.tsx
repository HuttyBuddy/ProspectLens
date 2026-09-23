import React, { useState } from 'react';
import {
  SavedProspect,
  PipelineStatus,
  PIPELINE_STATUSES,
  PipelineStats
} from './pipelineTypes';
import { updateProspectStatus, updateProspectNotes, deleteProspect } from './storageService';
import { ExportModal } from '../export/ExportModal';
import { UserSettings } from '../settings/settingsStore';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import {
  Search,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Phone,
  Mail,
  Calendar,
  Building,
  Download,
  FileSpreadsheet,
  Lock,
  Send
} from 'lucide-react';

interface ProspectsTableProps {
  prospects: SavedProspect[];
  stats: PipelineStats;
  onRefresh: () => void;
  onSelectProspect: (prospect: SavedProspect) => void;
  isPro?: boolean;
  isAgency?: boolean;
  settings?: UserSettings;
  onOpenUpgradeModal?: (feature: string) => void;
  onGenerateAuditPdf?: (prospect: SavedProspect) => void;
  onOpenCrmSync?: (prospect?: SavedProspect) => void;
}

export const ProspectsTable: React.FC<ProspectsTableProps> = ({
  prospects,
  stats,
  onRefresh,
  onSelectProspect,
  isPro = false,
  isAgency = false,
  settings,
  onOpenUpgradeModal,
  onGenerateAuditPdf,
  onOpenCrmSync
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const filtered = prospects.filter((p) => {
    const matchesSearch =
      !search ||
      p.businessName.toLowerCase().includes(search.toLowerCase()) ||
      p.domain.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: PipelineStatus) => {
    await updateProspectStatus(id, newStatus);
    onRefresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove "${name}" from your saved prospects?`)) {
      await deleteProspect(id);
      onRefresh();
    }
  };

  const handleSaveNotes = async (id: string) => {
    await updateProspectNotes(id, notesDraft);
    setEditingNotesId(null);
    onRefresh();
  };

  const handleOpenExport = () => {
    setIsExportModalOpen(true);
  };

  const getStatusBadge = (status: PipelineStatus) => {
    switch (status) {
      case 'Won':
        return <Badge variant="success">Won</Badge>;
      case 'Lost':
        return <Badge variant="danger">Lost</Badge>;
      case 'Interested':
      case 'Meeting':
      case 'Proposal':
        return <Badge variant="cyan">{status}</Badge>;
      case 'Ready to Contact':
        return <Badge variant="info">Ready to Contact</Badge>;
      case 'Contacted':
      case 'Follow Up':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Metric Badges Header */}
      <div className="grid grid-cols-5 gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center shadow-xs">
        <div>
          <div className="text-[11px] text-slate-400">Total</div>
          <div className="text-sm font-bold text-white">{stats.total}</div>
        </div>
        <div>
          <div className="text-[11px] text-sky-400">Ready</div>
          <div className="text-sm font-bold text-sky-300">{stats.readyToContact}</div>
        </div>
        <div>
          <div className="text-[11px] text-amber-400">Contacted</div>
          <div className="text-sm font-bold text-amber-300">{stats.contacted}</div>
        </div>
        <div>
          <div className="text-[11px] text-cyan-400">Interested</div>
          <div className="text-sm font-bold text-cyan-300">{stats.interested}</div>
        </div>
        <div>
          <div className="text-[11px] text-emerald-400">Won</div>
          <div className="text-sm font-bold text-emerald-300">{stats.won}</div>
        </div>
      </div>

      {/* Search, Filter and CSV Export */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search business, domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
        >
          <option value="All" className="bg-slate-900 text-white">All Statuses</option>
          {PIPELINE_STATUSES.map((s) => (
            <option key={s} value={s} className="bg-slate-900 text-white">
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={handleOpenExport}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shrink-0 ${
            isPro
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
          title="Export CSV / Excel with audit scores & cold outreach copy"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export</span>
          {!isPro && (
            <span className="flex items-center gap-0.5 px-1 py-0.2 bg-blue-950/90 text-cyan-300 border border-blue-600/40 rounded text-[9px] font-bold">
              <Lock className="w-2 h-2" /> PRO
            </span>
          )}
        </button>

        <button
          onClick={() => {
            const target = filtered[0] || prospects[0];
            onOpenCrmSync?.(target);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shrink-0 ${
            isAgency
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500 shadow-xs'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
          title={isAgency ? 'Push prospects to GoHighLevel/Zapier CRM' : 'CRM Webhook Sync is an AGENCY feature'}
        >
          <Send className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sync CRM</span>
          {!isAgency && (
            <span className="flex items-center gap-0.5 px-1 py-0.2 bg-cyan-950/90 text-cyan-300 border border-cyan-600/40 rounded text-[9px] font-bold">
              <Lock className="w-2 h-2" /> AGENCY
            </span>
          )}
        </button>
      </div>

      {/* Prospects List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
          <Building className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="font-semibold text-white">No saved prospects found</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Navigate to any local business website and click "Save Prospect" to track them here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((prospect) => {
            const isExpanded = expandedId === prospect.id;
            return (
              <div
                key={prospect.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xs hover:border-slate-700 transition"
              >
                {/* Top Row: Name, Domain, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white leading-snug">
                        {prospect.businessName}
                      </h4>
                      <a
                        href={prospect.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-cyan-400"
                        title="Open website"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {prospect.category} • {prospect.domain}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {/* Status Dropdown */}
                    <select
                      value={prospect.status}
                      onChange={(e) =>
                        handleStatusChange(prospect.id, e.target.value as PipelineStatus)
                      }
                      className="text-xs bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 font-medium text-slate-200 focus:outline-none"
                    >
                      {PIPELINE_STATUSES.map((st) => (
                        <option key={st} value={st} className="bg-slate-900 text-white">
                          {st}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : prospect.id)}
                      className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Opportunity Tag & Contact quick view */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="text-slate-300">
                    <span className="font-semibold text-slate-400">Service: </span>
                    <span className="text-cyan-400 font-medium">
                      {prospect.chosenService || prospect.opportunities[0]?.service || 'General Pitch'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    {prospect.phone && (
                      <span className="flex items-center gap-0.5 text-slate-300" title={prospect.phone}>
                        <Phone className="w-3 h-3" />
                      </span>
                    )}
                    {prospect.email && (
                      <span className="flex items-center gap-0.5 text-slate-300" title={prospect.email}>
                        <Mail className="w-3 h-3" />
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(prospect.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 text-xs">
                    {/* Contact Details */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 space-y-1 text-[11px] text-slate-300">
                      {prospect.phone && <div>📞 Phone: {prospect.phone}</div>}
                      {prospect.email && <div>✉️ Email: {prospect.email}</div>}
                      {prospect.location && <div>📍 Address: {prospect.location}</div>}
                    </div>

                    {/* Saved Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-300 flex items-center gap-1 text-[11px]">
                          <FileText className="w-3 h-3 text-slate-400" /> Notes
                        </span>
                        {editingNotesId !== prospect.id && (
                          <button
                            onClick={() => {
                              setEditingNotesId(prospect.id);
                              setNotesDraft(prospect.notes || '');
                            }}
                            className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {editingNotesId === prospect.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            rows={2}
                            placeholder="Add notes about conversations or follow-up..."
                            className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white focus:outline-none"
                          />
                          <div className="flex gap-1.5 justify-end">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setEditingNotesId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={() => handleSaveNotes(prospect.id)}
                            >
                              Save Notes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-300 italic bg-slate-950/80 border border-slate-800/80 p-1.5 rounded">
                          {prospect.notes || 'No notes yet.'}
                        </p>
                      )}
                    </div>

                    {/* Saved Outreach Preview if present */}
                    {prospect.savedOutreach && (
                      <div className="bg-blue-950/60 border border-blue-900/60 rounded-lg p-2 text-[11px]">
                        <span className="font-bold text-sky-300 block mb-0.5">
                          Saved Outreach ({prospect.savedOutreach.channel}):
                        </span>
                        <p className="text-slate-200 whitespace-pre-line">
                          {prospect.savedOutreach.body}
                        </p>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => onSelectProspect(prospect)}
                        >
                          Inspect in Copilot
                        </Button>

                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => onGenerateAuditPdf?.(prospect)}
                          title="Generate Client Audit PDF"
                          className="text-[10px]"
                        >
                          <Download className="w-3 h-3 mr-1 text-cyan-400" />
                          PDF Audit
                        </Button>

                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => {
                            if (!isAgency) {
                              onOpenUpgradeModal?.('Direct GoHighLevel & CRM Webhook Sync');
                              return;
                            }
                            onOpenCrmSync?.(prospect);
                          }}
                          title="Push lead to GoHighLevel / Zapier / HubSpot"
                          className="text-[10px]"
                        >
                          <Send className="w-3 h-3 mr-1 text-cyan-400" />
                          Send to CRM
                        </Button>
                      </div>

                      <button
                        onClick={() => handleDelete(prospect.id, prospect.businessName)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Lead & Audit Exporter Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        filteredProspects={filtered}
        allProspects={prospects}
        isPro={isPro}
        settings={settings}
        onOpenUpgradeModal={onOpenUpgradeModal}
      />
    </div>
  );
};
