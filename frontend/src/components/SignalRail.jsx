import { formatPercent } from '../lib/format';

const signalCards = [
  { key: 'precision', label: 'Precision' },
  { key: 'recall', label: 'Recall' },
  { key: 'f1_score', label: 'F1 score' },
  { key: 'false_positive_rate', label: 'False positive rate' },
];

export default function SignalRail({ metrics, apiStatus }) {
  return (
    <aside id="health" className="rounded-[24px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-lime-300">Live signals</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-zinc-50">Model health</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">{apiStatus}</span>
      </div>

      <div className="grid gap-3">
        {signalCards.map((card) => (
          <div key={card.key} className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.025] px-4 py-3">
            <span className="text-sm text-zinc-400">{card.label}</span>
            <strong className="font-mono text-[1rem] text-zinc-50">{formatPercent(metrics[card.key])}</strong>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[18px] border border-white/10 bg-white/[0.025] px-4 py-4 text-sm leading-6 text-zinc-400">
        <p className="m-0 text-zinc-100">The dashboard stays focused on one task: upload a CSV, read the model, and inspect the result.</p>
      </div>
    </aside>
  );
}
