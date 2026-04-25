import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const BIN_SIZE = 0.1;

function buildBins(values) {
  const bins = Array.from({ length: 10 }, (_, index) => ({
    label: `${(index * BIN_SIZE).toFixed(1)}-${((index + 1) * BIN_SIZE).toFixed(1)}`,
    count: 0,
  }));

  values.forEach((rawValue) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }

    const normalized = Math.max(0, Math.min(value, 0.9999));
    const index = Math.floor(normalized / BIN_SIZE);
    bins[index].count += 1;
  });

  return bins;
}

export default function ConfidenceHistogram({ predictions }) {
  const confidenceValues = useMemo(
    () => (Array.isArray(predictions) ? predictions.map(entry => Number(entry?.confidence)) : []),
    [predictions],
  );

  const bins = useMemo(() => buildBins(confidenceValues), [confidenceValues]);
  const hasData = bins.some(bin => bin.count > 0);

  const option = useMemo(() => ({
    animationDuration: 600,
    grid: {
      left: 38,
      right: 18,
      top: 18,
      bottom: 30,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(9, 16, 25, 0.95)',
      borderColor: 'rgba(148, 163, 184, 0.24)',
      textStyle: { color: '#e2e8f0' },
      formatter: (items) => {
        const item = items[0];
        return `${item.axisValue}<br/>Flows: ${item.value}`;
      },
    },
    xAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11 },
      data: bins.map(bin => bin.label),
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: bins.map(bin => bin.count),
        barWidth: '72%',
        itemStyle: {
          color: 'rgba(56, 189, 248, 0.72)',
          borderRadius: [6, 6, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: 'rgba(132, 204, 22, 0.82)',
          },
        },
      },
    ],
  }), [bins]);

  if (!hasData) {
    return <p className="text-sm text-zinc-500">No confidence scores available yet.</p>;
  }

  return <ReactECharts option={option} className="h-[240px] w-full" notMerge lazyUpdate />;
}
