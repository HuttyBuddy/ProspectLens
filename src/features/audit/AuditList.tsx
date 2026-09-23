import React from 'react';
import { Badge } from '../../shared/components/Badge';
import { AuditItem, AuditStatus } from '../extractor/types';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Eye } from 'lucide-react';

export const AuditList: React.FC<{ items: AuditItem[]; summary: string }> = ({ items, summary }) => {
  const [filter, setFilter] = React.useState<string>('All');

  const categories = ['All', 'Website', 'Conversions', 'Trust', 'Content & Media'];

  const filteredItems = filter === 'All' ? items : items.filter((i) => i.category === filter);

  const getStatusBadge = (status: AuditStatus) => {
    switch (status) {
      case 'Strong':
        return (
          <Badge variant="success" className="font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Strong
          </Badge>
        );
      case 'Present':
        return (
          <Badge variant="info">
            <Eye className="w-3 h-3" /> Present
          </Badge>
        );
      case 'Weak':
        return (
          <Badge variant="warning">
            <AlertTriangle className="w-3 h-3" /> Weak
          </Badge>
        );
      case 'Missing':
        return (
          <Badge variant="danger">
            <XCircle className="w-3 h-3" /> Missing
          </Badge>
        );
      default:
        return (
          <Badge variant="default">
            <HelpCircle className="w-3 h-3" /> Unable to determine
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed shadow-xs">
        <span className="font-semibold text-white block mb-0.5">Audit Assessment</span>
        {summary}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-2.5 py-1 rounded-md transition font-medium whitespace-nowrap cursor-pointer ${
              filter === cat
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-950 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 shadow-xs hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-white">{item.label}</span>
              {getStatusBadge(item.status)}
            </div>
            <p className="text-xs text-slate-300 leading-normal mb-1">{item.evidence}</p>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              {item.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
