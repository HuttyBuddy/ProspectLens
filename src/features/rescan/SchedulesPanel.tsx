import React from 'react';
import { CalendarClock, Plus, X, Bell } from 'lucide-react';
import { SavedProspect } from '../pipeline/pipelineTypes';
import {
  RescanSchedule,
  RescanFrequency,
  RESCAN_TICK_ALARM,
  getSchedules,
  createSchedule,
  cancelSchedule
} from './rescanScheduler';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';

interface SchedulesPanelProps {
  prospects: SavedProspect[];
}

function ensureTickAlarm(): void {
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.create(RESCAN_TICK_ALARM, { periodInMinutes: 60 });
  }
}

function maybeClearTickAlarm(remaining: RescanSchedule[]): void {
  if (remaining.length === 0 && typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.clear(RESCAN_TICK_ALARM);
  }
}

function formatNextRun(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = d.getTime() - now;
  if (diffMs <= 0) return 'Due now';
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `in ~${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ~${days}d`;
}

export const SchedulesPanel: React.FC<SchedulesPanelProps> = ({ prospects }) => {
  const [schedules, setSchedules] = React.useState<RescanSchedule[]>([]);
  const [prospectId, setProspectId] = React.useState('');
  const [frequency, setFrequency] = React.useState<RescanFrequency>('weekly');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setSchedules(await getSchedules());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!prospectId && prospects.length > 0) setProspectId(prospects[0].id);
  }, [prospects, prospectId]);

  const unscheduled = prospects.filter((p) => !schedules.some((s) => s.prospectId === p.id));

  const handleCreate = async () => {
    const prospect = prospects.find((p) => p.id === prospectId);
    if (!prospect) return;
    setSaving(true);
    try {
      await createSchedule(prospect, frequency);
      ensureTickAlarm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: string) => {
    await cancelSchedule(id);
    const remaining = schedules.filter((s) => s.id !== id);
    maybeClearTickAlarm(remaining);
    await load();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs">
      <div className="flex items-center gap-2 mb-1">
        <CalendarClock className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-white">Scheduled Re-scans</span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
        Automatically re-audit a prospect on a schedule. You get a notification when any pillar moves ≥10 points or the
        overall score moves ≥5.
      </p>

      {unscheduled.length > 0 ? (
        <div className="flex gap-1.5 mb-3">
          <select
            value={prospectId}
            onChange={(e) => setProspectId(e.target.value)}
            className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {unscheduled.map((p) => (
              <option key={p.id} value={p.id}>
                {p.businessName}
              </option>
            ))}
          </select>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as RescanFrequency)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <Button size="sm" onClick={handleCreate} disabled={saving || !prospectId} isLoading={saving}>
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 mb-3">
          {prospects.length === 0
            ? 'Save a prospect to schedule re-scans.'
            : 'All saved prospects already have a schedule.'}
        </p>
      )}

      {schedules.length > 0 && (
        <div className="space-y-1.5">
          {schedules.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 bg-slate-800/50 border border-slate-800 rounded-lg px-2.5 py-2"
            >
              <Bell className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{s.businessName}</p>
                <p className="text-[10px] text-slate-500">
                  {s.frequency === 'daily' ? 'Daily' : 'Weekly'} · next run {formatNextRun(s.nextRunAt)}
                </p>
              </div>
              <Badge variant="info" className="shrink-0">
                {s.frequency}
              </Badge>
              <button
                onClick={() => handleCancel(s.id)}
                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer shrink-0"
                title="Cancel schedule"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
