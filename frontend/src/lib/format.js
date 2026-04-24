export function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '--%';
  }

  return `${value.toFixed(2)}%`;
}

export function formatCount(value) {
  return Number(value || 0).toLocaleString();
}
