import { useMemo, useState } from 'react';
import { formatCount, formatPercent } from '../lib/format';
import ThreatChart from './ThreatChart';
import AttackTypeChart from './AttackTypeChart';
import ConfidenceHistogram from './ConfidenceHistogram';

const MAX_ROWS_RENDERED = 1500;

const STAGE_OPTIONS = [
  { value: 'all', label: 'All stages' },
  { value: 'Stage 1 Benign', label: 'Stage 1 Benign' },
  { value: 'Stage 2 Classified', label: 'Stage 2 Classified' },
  { value: 'Stage 2 Review', label: 'Stage 2 Review' },
];

const SEVERITY_MAP = {
  DDoS: 'Critical',
  DoS: 'High',
  Heartbleed: 'Critical',
  Infiltration: 'High',
  PortScan: 'Medium',
  Bot: 'High',
  FTPPatator: 'Medium',
  SSHPatator: 'Medium',
  WebAttackBruteForce: 'Medium',
  WebAttackSqlInjection: 'Critical',
  WebAttackXSS: 'High',
  BruteForce: 'High',
};

function getStage(entry) {
  if (entry?.prediction !== 'ATTACK') {
    return 'Stage 1 Benign';
  }

  if (entry?.attack_type === 'Needs Review') {
    return 'Stage 2 Review';
  }

  if (entry?.attack_type) {
    return 'Stage 2 Classified';
  }
}

function getSeverity(entry) {
  if (entry?.prediction !== 'ATTACK') {
    return 'Low';
  }

  if (entry?.attack_type === 'Needs Review') {
    return 'High';
  }

  return SEVERITY_MAP[entry?.attack_type] || 'Medium';
}

function severityClass(severity) {
  if (severity === 'Critical') {
    return 'border-rose-300/35 bg-rose-300/12 text-rose-100';
  }
  if (severity === 'High') {
    return 'border-orange-300/35 bg-orange-300/12 text-orange-100';
  }
  if (severity === 'Medium') {
    return 'border-amber-300/35 bg-amber-300/12 text-amber-100';
  }
  return 'border-emerald-300/35 bg-emerald-300/12 text-emerald-100';
}

function toCsv(rows) {
  const header = ['Flow #', 'Label', 'Attack Type', 'Confidence', 'Stage', 'Severity'];
  const lines = rows.map(row => [
    row.flowNumber,
    row.prediction,
    row.attackType,
    row.confidence.toFixed(4),
    row.stage,
    row.severity,
  ]);

  const allRows = [header, ...lines];
  return allRows
    .map(cols => cols.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export default function ResultsPanel({ results, isProcessing, lastAnalyzedAt }) {
  const [sortKey, setSortKey] = useState('confidence');
  const [sortDirection, setSortDirection] = useState('desc');
  const [stageFilter, setStageFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const totalFlows = Number(results?.total_flows) || 0;
  const attackCount = Number(results?.attack_count) || 0;
  const benignCount = Number(results?.benign_count) || 0;
  const attackRate = Number.isFinite(Number(results?.attack_percentage))
    ? Number(results.attack_percentage)
    : totalFlows > 0
      ? (attackCount / totalFlows) * 100
      : 0;

  const attackEntries = results?.attack_type_counts && typeof results.attack_type_counts === 'object'
    ? Object.entries(results.attack_type_counts).sort((left, right) => right[1] - left[1])
    : [];

  const rows = useMemo(() => {
    const source = Array.isArray(results?.predictions) ? results.predictions : [];

    return source.map((entry, index) => {
      const stage = getStage(entry);
      const attackType = entry?.attack_type || (entry?.prediction === 'ATTACK' ? 'Unclassified' : 'BENIGN');

      return {
        id: `${index + 1}-${entry?.prediction || 'unknown'}`,
        flowNumber: index + 1,
        prediction: entry?.prediction || 'UNKNOWN',
        attackType,
        confidence: Number(entry?.confidence) || 0,
        stage,
        severity: getSeverity(entry),
      };
    });
  }, [results?.predictions]);

  const stageCounts = useMemo(() => {
    const counts = {
      all: rows.length,
      'Stage 1 Benign': 0,
      'Stage 1 Attack': 0,
      'Stage 2 Classified': 0,
      'Stage 2 Review': 0,
    };

    rows.forEach((row) => {
      counts[row.stage] = (counts[row.stage] || 0) + 1;
    });

    return counts;
  }, [rows]);

  const needsReviewCount = useMemo(
    () => rows.filter(row => row.attackType === 'Needs Review').length,
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const stagePass = stageFilter === 'all' || row.stage === stageFilter;
      const textPass = !query
        || row.attackType.toLowerCase().includes(query)
        || row.prediction.toLowerCase().includes(query)
        || String(row.flowNumber).includes(query);

      return stagePass && textPass;
    });
  }, [rows, stageFilter, searchText]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows].sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return leftValue - rightValue;
      }

      return String(leftValue).localeCompare(String(rightValue));
    });

    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [filteredRows, sortDirection, sortKey]);

  const visibleRows = useMemo(
    () => sortedRows.slice(0, MAX_ROWS_RENDERED),
    [sortedRows],
  );

  const topSuspicious = useMemo(
    () => rows
      .filter(row => row.prediction === 'ATTACK')
      .sort((left, right) => right.confidence - left.confidence)
      .slice(0, 5),
    [rows],
  );

  const canExport = rows.length > 0;

  function handleSort(nextKey) {
    if (sortKey === nextKey) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextKey);
    setSortDirection('desc');
  }

  function handleExportCsv() {
    const csv = toCsv(sortedRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `intrusioniq-results-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  const sortIndicator = sortDirection === 'asc' ? '^' : 'v';

  return (
    <article id="results" className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-lime-300">Prediction output</p>
          <h3 className="text-[clamp(1.25rem,1.5vw,1.7rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-zinc-50">
            Threat summary
          </h3>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={!canExport}
          className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3.5 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Export results CSV
        </button>
      </div>

      {isProcessing && !results ? <LoadingSkeleton /> : null}

      {results ? (
        <div className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="flex h-full flex-col rounded-[22px] border border-white/10 bg-white/2 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="m-0 text-base font-semibold tracking-[-0.03em] text-zinc-50">Benign vs attack share</h4>
                  <p className="m-0 mt-1 text-sm text-zinc-500">Updated after each upload</p>
                </div>
              </div>

              <div className="mx-auto flex w-full max-w-195 flex-1 items-center">
                <ThreatChart benignCount={benignCount} attackCount={attackCount} totalFlows={totalFlows} />
              </div>
              <p className="mt-auto pt-3 text-center text-xs uppercase tracking-[0.14em] text-zinc-500">Benign and attack ring comparison</p>
            </section>

            <section className="rounded-[22px] border border-white/10 bg-white/2 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="m-0 text-base font-semibold tracking-[-0.03em] text-zinc-50">Attack type share</h4>
                  <p className="m-0 mt-1 text-sm text-zinc-500">Distribution across detected attack families</p>
                </div>
              </div>

              <div className="mx-auto w-full max-w-195">
                <AttackTypeChart attackEntries={attackEntries} />
              </div>
              <p className="mt-3 text-center text-xs uppercase tracking-[0.14em] text-zinc-500">Attack share by family (percentage)</p>
            </section>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Total flows" value={formatCount(totalFlows)} />
            <SummaryCard label="Attacks" value={formatCount(attackCount)} tone="rose" />
            <SummaryCard label="Benign" value={formatCount(benignCount)} tone="emerald" />
            <SummaryCard label="Attack rate" value={formatPercent(attackRate)} tone="rose" />
            <SummaryCard label="Needs review" value={formatCount(needsReviewCount)} tone="amber" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.5fr)]">
            <section className="rounded-[22px] border border-white/10 bg-white/2 p-5">
              <h4 className="m-0 text-base font-semibold tracking-[-0.03em] text-zinc-50">Confidence score distribution</h4>
              <p className="m-0 mt-1 text-sm text-zinc-500">Histogram over binary confidence values for all predicted flows.</p>
              <div className="mt-4">
                <ConfidenceHistogram predictions={results?.predictions} />
              </div>
            </section>

            <section className="rounded-[22px] border border-white/10 bg-white/2 p-5">
              <h4 className="m-0 text-base font-semibold tracking-[-0.03em] text-zinc-50">Top suspicious flows</h4>
              <p className="m-0 mt-1 text-sm text-zinc-500">Top 5 ATTACK predictions ranked by confidence.</p>
              <div className="mt-4 grid gap-2">
                {topSuspicious.length > 0 ? topSuspicious.map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-[14px] border border-white/10 bg-black/20 px-3 py-2 text-sm">
                    <span className="text-zinc-200">Flow {formatCount(row.flowNumber)} - {row.attackType}</span>
                    <span className="font-mono text-zinc-100">{(row.confidence * 100).toFixed(2)}%</span>
                  </div>
                )) : <p className="text-sm text-zinc-500">No suspicious flows in this run.</p>}
              </div>
            </section>
          </div>

          <section className="rounded-[22px] border border-white/10 bg-white/2 p-5">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h4 className="m-0 text-base font-semibold tracking-[-0.03em] text-zinc-50">Per-flow prediction table</h4>
                <p className="m-0 mt-1 text-sm text-zinc-500">Sortable and filterable flow-level output with review highlights.</p>
              </div>

              <div className="grid gap-3 xl:min-w-190">
                <div className="flex flex-wrap gap-2">
                  {STAGE_OPTIONS.map((option) => {
                    const isActive = stageFilter === option.value;
                    const count = stageCounts[option.value] || 0;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStageFilter(option.value)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${isActive ? 'border-lime-300/35 bg-lime-300/10 text-zinc-50 shadow-[0_0_0_1px_rgba(163,230,53,0.12)]' : 'border-white/10 bg-black/25 text-zinc-300 hover:border-white/20 hover:bg-white/6 hover:text-zinc-50'}`}
                        aria-pressed={isActive}
                      >
                        <span>{option.label}</span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[0.7rem] text-zinc-400">
                          {formatCount(count)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-3 py-2">
                  <span className="text-[0.72rem] uppercase tracking-[0.16em] text-zinc-500">Search</span>
                  <input
                    value={searchText}
                    onChange={event => setSearchText(event.target.value)}
                    className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                    placeholder="Filter by flow, label, attack type"
                  />
                </div>
              </div>
            </div>

            {sortedRows.length > MAX_ROWS_RENDERED ? (
              <p className="mb-3 text-xs uppercase tracking-[0.12em] text-amber-200">
                Showing first {formatCount(MAX_ROWS_RENDERED)} of {formatCount(sortedRows.length)} rows for performance.
              </p>
            ) : null}

            <div className="overflow-x-auto rounded-[14px] border border-white/10">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-white/4 text-zinc-300">
                  <tr>
                    <SortableHeader label="Flow #" sortKey="flowNumber" currentSort={sortKey} direction={sortDirection} indicator={sortIndicator} onSort={handleSort} />
                    <SortableHeader label="Label" sortKey="prediction" currentSort={sortKey} direction={sortDirection} indicator={sortIndicator} onSort={handleSort} />
                    <SortableHeader label="Attack Type" sortKey="attackType" currentSort={sortKey} direction={sortDirection} indicator={sortIndicator} onSort={handleSort} />
                    <SortableHeader label="Confidence" sortKey="confidence" currentSort={sortKey} direction={sortDirection} indicator={sortIndicator} onSort={handleSort} />
                    <SortableHeader label="Stage" sortKey="stage" currentSort={sortKey} direction={sortDirection} indicator={sortIndicator} onSort={handleSort} />
                    <SortableHeader label="Severity" sortKey="severity" currentSort={sortKey} direction={sortDirection} indicator={sortIndicator} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length > 0 ? visibleRows.map((row) => {
                    const isNeedsReview = row.attackType === 'Needs Review';
                    return (
                      <tr
                        key={row.id}
                        className={`border-t border-white/8 ${isNeedsReview ? 'bg-amber-300/10' : 'bg-transparent'}`}
                      >
                        <td className="px-3 py-2 font-mono text-zinc-300">{formatCount(row.flowNumber)}</td>
                        <td className="px-3 py-2 text-zinc-100">{row.prediction}</td>
                        <td className="px-3 py-2 text-zinc-200">{row.attackType}</td>
                        <td className="px-3 py-2 font-mono text-zinc-100">{(row.confidence * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2 text-zinc-300">{row.stage}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full border px-2 py-0.5 text-xs ${severityClass(row.severity)}`}>
                            {row.severity}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td className="px-3 py-4 text-zinc-500" colSpan={6}>No flows match your current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-4 rounded-[22px] border border-dashed border-white/10 bg-white/2 p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <h4 className="m-0 text-base font-semibold tracking-[-0.03em] text-zinc-50">No traffic loaded</h4>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Upload a CICIDS2017 CSV to inspect benign vs attack flows, confidence distribution, per-flow classifications, and suspicious rankings.</p>
          </div>
          <div className="grid gap-2 rounded-[18px] border border-white/10 bg-white/2.5 p-4 text-sm text-zinc-500">
            <p className="m-0 text-[0.72rem] uppercase tracking-[0.18em] text-zinc-500">What appears here</p>
            <p className="m-0">Flow totals, review count, chart distribution, ranked suspicious flows, and full per-flow table with export.</p>
          </div>
        </div>
      )}
    </article>
  );
}

function SortableHeader({ label, sortKey, currentSort, direction, indicator, onSort }) {
  const isActive = currentSort === sortKey;

  return (
    <th className="px-3 py-2 text-left font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-zinc-300 hover:text-zinc-100"
      >
        {label}
        {isActive ? <span>{indicator}</span> : <span className="opacity-30">{direction === 'asc' ? '^' : 'v'}</span>}
      </button>
    </th>
  );
}

function SummaryCard({ label, value, tone = 'default' }) {
  const toneClasses = {
    rose: 'border-rose-400/20 bg-rose-400/8',
    emerald: 'border-emerald-400/20 bg-emerald-400/8',
    amber: 'border-amber-300/20 bg-amber-300/10',
    default: 'border-white/10 bg-white/2.5',
  };

  return (
    <div className={`grid gap-1 rounded-[18px] border px-4 py-4 ${toneClasses[tone]}`}>
      <span className="text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      <strong className="font-mono text-[1.05rem] text-zinc-50">{value}</strong>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mb-5 grid gap-3 rounded-[18px] border border-white/10 bg-white/2 p-4">
      <div className="h-4 w-56 animate-pulse rounded bg-white/10" />
      <div className="h-20 animate-pulse rounded-[14px] bg-white/8" />
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="h-14 animate-pulse rounded-[14px] bg-white/8" />
        <div className="h-14 animate-pulse rounded-[14px] bg-white/8" />
        <div className="h-14 animate-pulse rounded-[14px] bg-white/8" />
      </div>
    </div>
  );
}

