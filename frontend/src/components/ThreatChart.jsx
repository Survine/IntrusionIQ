import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export default function ThreatChart({ benignCount, attackCount, totalFlows }) {
  const hasData = totalFlows > 0;

  const chartData = useMemo(() => {
    if (!hasData) {
      return [{ name: 'No traffic loaded', value: 1, itemStyle: { color: '#52525b' } }];
    }

    return [
      { name: 'Attacks', value: attackCount, itemStyle: { color: '#ef4444' } },
      { name: 'Benign', value: benignCount, itemStyle: { color: '#22c55e' } },
    ];
  }, [attackCount, benignCount, hasData]);

  const labelRows = useMemo(() => {
    if (!hasData) {
      return [];
    }

    return [
      {
        name: 'Attacks',
        percent: totalFlows > 0 ? (attackCount / totalFlows) * 100 : 0,
        color: '#ef4444',
      },
      {
        name: 'Benign',
        percent: totalFlows > 0 ? (benignCount / totalFlows) * 100 : 0,
        color: '#22c55e',
      },
    ];
  }, [attackCount, benignCount, hasData, totalFlows]);

  const option = useMemo(() => ({
    animationDuration: 650,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(9, 16, 25, 0.95)',
      borderColor: 'rgba(148, 163, 184, 0.24)',
      textStyle: { color: '#e2e8f0' },
      formatter: hasData
        ? (params) => `${params.name}: ${params.percent.toFixed(2)}%`
        : () => 'Upload traffic data to render this chart',
    },
    series: [
      {
        type: 'pie',
        radius: ['56%', '78%'],
        center: ['50%', '50%'],
        startAngle: 90,
        padAngle: 1,
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
    <div className="grid h-full w-full gap-3 md:grid-cols-[minmax(0,0.5fr)_minmax(240px,0.5fr)] md:items-stretch">
      <div className="flex h-full min-h-[300px] w-full items-center justify-end pr-1 sm:min-h-[330px]">
        <ReactECharts option={option} className="h-[300px] w-full sm:h-[330px]" notMerge lazyUpdate />
      </div>

      <div className="flex h-full items-center pr-1">
        {hasData ? (
          <div className="space-y-2">
            {labelRows.map((row) => (
              <div key={row.name} className="flex items-start gap-2.5 text-base leading-6 text-zinc-200">
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="min-w-0">
                  <span className="break-words font-semibold text-zinc-100">{row.name}</span>
                  <span className="ml-1 text-zinc-300">{row.percent.toFixed(2)}%</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No traffic loaded.</p>
        )}
      </div>
    </div>
  );
}

