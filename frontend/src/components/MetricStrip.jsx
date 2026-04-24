import { formatPercent } from '../lib/format';

const metricCards = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'f1_score', label: 'F1 score' },
  { key: 'recall', label: 'Recall' },
  { key: 'false_positive_rate', label: 'False positive rate' },
];

export default function MetricStrip({ metrics }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Model metrics">
      {metricCards.map((card) => (
        <article key={card.key} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-zinc-500">{card.label}</p>
          <h3 className="mt-2 font-mono text-[1.25rem] font-semibold tracking-[-0.03em] text-zinc-50">{formatPercent(metrics[card.key])}</h3>
        </article>
      ))}
    </section>
  );
}
