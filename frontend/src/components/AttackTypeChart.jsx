import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const palette = ['#f43f5e', '#f97316', '#f59e0b', '#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#e879f9', '#34d399', '#84cc16'];

export default function AttackTypeChart({ attackEntries }) {
  const normalizedEntries = useMemo(() => {
    if (!attackEntries || attackEntries.length === 0) {
      return [];
    }

    return attackEntries
      .map(([attackType, count]) => [attackType, Number(count) || 0])
      .filter(([, count]) => count > 0)
      .sort((left, right) => right[1] - left[1]);
  }, [attackEntries]);

  const totalAttacks = useMemo(
    () => normalizedEntries.reduce((sum, [, count]) => sum + count, 0),
    [normalizedEntries],
  );

  const hasData = totalAttacks > 0;

  const chartData = useMemo(() => {
    if (!hasData) {
      return [{ name: 'No attacks', value: 1, itemStyle: { color: '#52525b' } }];
    }

    return normalizedEntries.map(([name, value], index) => ({
      name,
      value,
      itemStyle: {
        color: palette[index % palette.length],
      },
    }));
  }, [hasData, normalizedEntries]);

  const labelRows = useMemo(() => {
    if (!hasData) {
      return [];
    }

    return normalizedEntries.map(([name, value], index) => ({
      name,
      percent: (value / totalAttacks) * 100,
      color: palette[index % palette.length],
    }));
  }, [hasData, normalizedEntries, totalAttacks]);

  const option = useMemo(() => ({
    animationDuration: 650,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(9, 16, 25, 0.95)',
      borderColor: 'rgba(148, 163, 184, 0.24)',
      textStyle: { color: '#e2e8f0' },
      formatter: hasData
        ? (params) => `${params.name}: ${params.percent.toFixed(2)}%`
        : () => 'No attack classes detected',
    },
    series: [
      {
        type: 'pie',
        radius: ['56%', '78%'],
        center: ['50%', '50%'],
        startAngle: 90,
        padAngle: 1,
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: 'rgba(241, 245, 249, 0.12)',
          borderWidth: 1,
        },
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        emphasis: {
          scale: false,
        },
        data: chartData,
      },
    ],
  }), [chartData, hasData]);

  return (
    <div className="grid h-full w-full gap-4 md:grid-cols-[minmax(0,0.5fr)_minmax(240px,0.5fr)] md:items-center">
      <div className="h-[300px] w-full sm:h-[330px]">
        <ReactECharts option={option} className="h-full w-full" notMerge lazyUpdate />
      </div>

      <div className="space-y-2 pr-1">
        {hasData ? (
          labelRows.map((row) => (
            <div key={row.name} className="flex items-start gap-2.5 text-base leading-6 text-zinc-200">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="min-w-0">
                <span className="break-words font-semibold text-zinc-100">{row.name}</span>
                <span className="ml-1 text-zinc-300">{row.percent.toFixed(2)}%</span>
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-500">No attack classes detected.</p>
        )}
      </div>
    </div>
  );
}
