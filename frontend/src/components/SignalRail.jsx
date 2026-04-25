import { formatPercent } from '../lib/format';

const signalCards = [
  { key: 'precision', label: 'Precision' },
  { key: 'recall', label: 'Recall' },
  { key: 'f1_score', label: 'F1 score' },
  { key: 'false_positive_rate', label: 'False positive rate' },
];

const modelLabels = [
  ['rf', 'RF'],
  ['xgb', 'XGB'],
  ['mlp', 'MLP'],
  ['iso', 'ISO'],
  ['multiclass', 'Multi-class'],
];

function getStatusStyles(status) {
  if (status === 'loaded') {
    return 'border-emerald-300/30 bg-emerald-300/12 text-emerald-100';
  }

  if (status === 'missing') {
    return 'border-rose-300/30 bg-rose-300/12 text-rose-100';
  }

  return 'border-zinc-300/25 bg-zinc-400/10 text-zinc-200';
}

function getModelStatus(health, key) {
  const hasModelMap = health?.model_status && typeof health.model_status === 'object';

  if (hasModelMap && key in health.model_status) {
    return health.model_status[key] ? 'loaded' : 'missing';
  }

  if (health?.model_loaded === true) {
    return 'loaded';
  }

  if (health?.model_loaded === false) {
    return 'missing';
  }

  return 'unknown';
}

function statusLabel(status) {
  if (status === 'loaded') {
    return 'Loaded';
  }

  if (status === 'missing') {
    return 'Missing';
  }

  return 'Pending';
}

export default function SignalRail({ metrics, apiStatus, health, healthStatus, isHealthLoading }) {
  return (
    <aside id="health" className="rounded-[24px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-lime-300">Live signals</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-zinc-50">Model health</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
          {isHealthLoading ? 'Pinging /health...' : healthStatus || apiStatus}
        </span>
      </div>

      <div className="grid gap-3">
        {signalCards.map((card) => (
          <div key={card.key} className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.025] px-4 py-3">
            <span className="text-sm text-zinc-400">{card.label}</span>
            <strong className="font-mono text-[1rem] text-zinc-50">{formatPercent(metrics[card.key])}</strong>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.025] px-4 py-4">
        <p className="m-0 text-[0.7rem] uppercase tracking-[0.15em] text-zinc-500">Model load status</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {modelLabels.map(([key, label]) => {
            const modelStatus = getModelStatus(health, key);
            return (
              <div key={key} className="flex items-center justify-between rounded-[14px] border border-white/10 bg-black/20 px-3 py-2 text-sm">
                <span className="text-zinc-300">{label}</span>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${getStatusStyles(modelStatus)}`}>
                  {statusLabel(modelStatus)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
