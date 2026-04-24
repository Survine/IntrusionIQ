import { formatCount, formatPercent } from '../lib/format';
import ThreatChart from './ThreatChart';

const attackAccentClasses = [
  'border-rose-400/20 bg-rose-400/8',
  'border-orange-400/20 bg-orange-400/8',
  'border-amber-400/20 bg-amber-400/8',
  'border-sky-400/20 bg-sky-400/8',
  'border-violet-400/20 bg-violet-400/8',
  'border-fuchsia-400/20 bg-fuchsia-400/8',
];

export default function ResultsPanel({ results }) {
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

  return (
    <article id="results" className="rounded-[24px] border border-white/10 bg-white/[0.035] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="mb-5 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-lime-300">Prediction output</p>
          <h3 className="text-[clamp(1.25rem,1.5vw,1.7rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-zinc-50">Threat summary</h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-zinc-400">A concise readout of flow counts, attack rate, and the most common attack families.</p>
      </div>

      {results ? (
        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Total flows" value={formatCount(totalFlows)} />
            <SummaryCard label="Attacks" value={formatCount(attackCount)} tone="rose" />
            <SummaryCard label="Benign" value={formatCount(benignCount)} tone="emerald" />
            <SummaryCard label="Attack rate" value={formatPercent(attackRate)} tone="rose" />
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section className="rounded-[22px] border border-white/10 bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="m-0 text-base font-semibold tracking-[-0.03em] text-zinc-50">Benign vs attack share</h4>
                  <p className="m-0 mt-1 text-sm text-zinc-500">Updated after each upload</p>
                </div>
              </div>
              <div className="relative min-h-[280px]">
                <ThreatChart benignCount={benignCount} attackCount={attackCount} totalFlows={totalFlows} />
              </div>
            </section>

            <section className="rounded-[22px] border border-white/10 bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="m-0 text-base font-semibold tracking-[-0.03em] text-zinc-50">Attack breakdown</h4>
                  <p className="m-0 mt-1 text-sm text-zinc-500">Most frequent families first</p>
                </div>
              </div>
              <ul className="grid gap-2">
                {attackEntries.length > 0 ? attackEntries.map(([attackType, count], index) => {
                  const accentClass = attackAccentClasses[index % attackAccentClasses.length];

                  return (
                    <li key={attackType} className={`flex items-center justify-between gap-4 rounded-[16px] border px-4 py-3 ${accentClass}`}>
                      <div className="flex min-w-0 items-center gap-3 font-medium text-zinc-100">
                        <span className="h-2.5 w-2.5 rounded-full bg-current opacity-80" />
                        <span className="truncate">{attackType}</span>
                      </div>
                      <div className="whitespace-nowrap font-mono text-zinc-400">{formatCount(count)} flows</div>
                    </li>
                  );
                }) : (
                  <li className="rounded-[16px] border border-white/10 bg-white/[0.025] px-4 py-3 text-center text-sm text-zinc-500">
                    No specific mapped attacks returned for this upload.
                  </li>
                )}
              </ul>
            </section>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <h4 className="m-0 text-base font-semibold tracking-[-0.03em] text-zinc-50">No traffic loaded</h4>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Upload a CICIDS2017 CSV to inspect benign vs attack flows, model confidence, and attack breakdowns.</p>
          </div>
          <div className="grid gap-2 rounded-[18px] border border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-500">
            <p className="m-0 text-[0.72rem] uppercase tracking-[0.18em] text-zinc-500">What appears here</p>
            <p className="m-0">Flow totals, attack rate, chart distribution, and the ranked attack family list.</p>
          </div>
        </div>
      )}
    </article>
  );
}

function SummaryCard({ label, value, tone = 'default' }) {
  const toneClasses = {
    rose: 'border-rose-400/20 bg-rose-400/8',
    emerald: 'border-emerald-400/20 bg-emerald-400/8',
    default: 'border-white/10 bg-white/[0.025]',
  };

  return (
    <div className={`grid gap-1 rounded-[18px] border px-4 py-4 ${toneClasses[tone]}`}>
      <span className="text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      <strong className="font-mono text-[1.05rem] text-zinc-50">{value}</strong>
    </div>
  );
}
