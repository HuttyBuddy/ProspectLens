import React from 'react';
import { GitCompareArrows, Plus, Trash2, ExternalLink, Zap, Loader2 } from 'lucide-react';
import { SavedProspect } from '../pipeline/pipelineTypes';
import {
  CompetitorBenchmark,
  PillarGap,
  computeGaps,
  generatePitchAngles,
  getBenchmarks,
  runCompetitorBenchmark,
  deleteBenchmark
} from './benchmarkService';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';

interface BenchmarkPanelProps {
  prospects: SavedProspect[];
  onRefreshProspects: () => Promise<void>;
}

function ScoreCell({ score, highlight }: { score: number; highlight: 'ahead' | 'behind' | 'none' }) {
  const bg =
    highlight === 'ahead'
      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40'
      : highlight === 'behind'
        ? 'bg-rose-950/60 text-rose-300 border-rose-700/40'
        : 'bg-slate-800/60 text-slate-200 border-slate-700/50';
  return (
    <span className={`inline-block min-w-10 text-center text-xs font-bold px-1.5 py-1 rounded-md border ${bg}`}>
      {score}
    </span>
  );
}

export const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({ prospects, onRefreshProspects }) => {
  const [prospectId, setProspectId] = React.useState<string>('');
  const [urls, setUrls] = React.useState<string[]>(['', '', '']);
  const [running, setRunning] = React.useState(false);
  const [benchmarks, setBenchmarks] = React.useState<CompetitorBenchmark[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const prospect = prospects.find((p) => p.id === prospectId) || null;

  const loadBenchmarks = React.useCallback(async () => {
    if (!prospectId) {
      setBenchmarks([]);
      return;
    }
    const list = await getBenchmarks(prospectId);
    setBenchmarks(list);
    setSelectedId((prev) => prev || (list.length > 0 ? list[list.length - 1].id : null));
  }, [prospectId]);

  React.useEffect(() => {
    loadBenchmarks();
  }, [loadBenchmarks]);

  React.useEffect(() => {
    if (!prospectId && prospects.length > 0) setProspectId(prospects[0].id);
  }, [prospects, prospectId]);

  const setUrl = (idx: number, value: string) => {
    setUrls((prev) => prev.map((u, i) => (i === idx ? value : u)));
  };

  const handleRun = async () => {
    const targets = urls.map((u) => u.trim()).filter(Boolean);
    if (!prospect || targets.length === 0) return;
    setRunning(true);
    setError(null);
    try {
      for (const url of targets) {
        const bench = await runCompetitorBenchmark(prospect.id, url);
        setSelectedId(bench.id);
      }
      setUrls(['', '', '']);
      await loadBenchmarks();
      await onRefreshProspects();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Benchmark failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!prospect) return;
    await deleteBenchmark(prospect.id, id);
    if (selectedId === id) setSelectedId(null);
    await loadBenchmarks();
  };

  const selected = benchmarks.find((b) => b.id === selectedId) || null;
  const prospectPillars = prospect?.pillarScores || [];
  const gaps: PillarGap[] = selected ? computeGaps(prospectPillars, selected.pillarScores) : [];
  const angles = selected && prospect ? generatePitchAngles(gaps, prospect.businessName, selected.competitorName) : [];

  return (
    <div className="space-y-3">
      {/* Setup card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <GitCompareArrows className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Competitor Benchmarking</span>
        </div>

        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          Saved prospect
        </label>
        <select
          value={prospectId}
          onChange={(e) => setProspectId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-2.5 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {prospects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.businessName} ({p.domain})
            </option>
          ))}
        </select>

        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          Competitor URLs (1–3)
        </label>
        <div className="space-y-1.5 mb-3">
          {urls.map((u, i) => (
            <input
              key={i}
              value={u}
              onChange={(e) => setUrl(i, e.target.value)}
              placeholder={`competitor${i + 1}.com`}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-2.5 py-2 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>

        <Button
          onClick={handleRun}
          disabled={running || !prospect || urls.every((u) => !u.trim())}
          isLoading={running}
          className="w-full"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Run Benchmark
        </Button>
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
        <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
          Runs the full audit engine against each competitor site — same 5 pillars, scored identically.
        </p>
      </div>

      {/* Saved benchmarks */}
      {benchmarks.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Benchmarks</p>
          <div className="space-y-1.5">
            {benchmarks.map((b) => (
              <div
                key={b.id}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                  selectedId === b.id
                    ? 'bg-blue-950/40 border-blue-700/50'
                    : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => setSelectedId(b.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{b.competitorName}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {b.competitorUrl} · {new Date(b.auditedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={b.overallScore >= 70 ? 'success' : b.overallScore >= 50 ? 'warning' : 'danger'}>
                  {b.overallScore}
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(b.id);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                  title="Delete benchmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison table */}
      {selected && prospect && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-white">
              {prospect.businessName} <span className="text-slate-500 font-normal">vs</span> {selected.competitorName}
            </p>
            <a
              href={selected.competitorUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-blue-400"
              title="Open competitor site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {prospectPillars.length === 0 && (
            <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 rounded-lg p-2 mb-2">
              This prospect was saved before pillar snapshots existed — prospect scores show as 0. Re-save the prospect
              after a fresh scan for an accurate comparison.
            </p>
          )}

          <div className="space-y-1">
            {gaps.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-2 bg-slate-800/40 border border-slate-800 rounded-lg px-2 py-1.5"
              >
                <span className="flex-1 text-[11px] font-medium text-slate-300 leading-tight">{g.category}</span>
                <div className="flex items-center gap-1.5">
                  <ScoreCell score={g.prospectScore} highlight={g.delta <= -10 ? 'ahead' : 'none'} />
                  <span className="text-[10px] text-slate-500 w-8 text-center font-mono">
                    {g.delta > 0 ? `+${g.delta}` : g.delta}
                  </span>
                  <ScoreCell score={g.competitorScore} highlight={g.delta >= 10 ? 'behind' : 'none'} />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="flex-1 text-[11px] font-bold text-white">Overall</span>
              <div className="flex items-center gap-1.5">
                <ScoreCell score={prospect.overallScore ?? 0} highlight="none" />
                <span className="text-[10px] text-slate-500 w-8 text-center font-mono">
                  {(selected.overallScore - (prospect.overallScore ?? 0)) > 0
                    ? `+${selected.overallScore - (prospect.overallScore ?? 0)}`
                    : selected.overallScore - (prospect.overallScore ?? 0)}
                </span>
                <ScoreCell score={selected.overallScore} highlight="none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pitch angles */}
      {angles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pitch angles</p>
          {angles.map((a, i) => (
            <div key={i} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-white">{a.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-1.5">{a.angle}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{a.evidence}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
