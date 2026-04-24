import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function ThreatChart({ benignCount, attackCount, totalFlows }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Benign', 'Attacks'],
        datasets: [{
          data: [1, 0],
          backgroundColor: ['#4ade80', '#a3e635'],
          borderColor: ['rgba(74, 222, 128, 0.16)', 'rgba(163, 230, 53, 0.16)'],
          borderWidth: 1,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            callbacks: {
              label(context) {
                return ` ${context.label}: ${context.formattedValue}`;
              },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    chartRef.current.data.datasets[0].data = totalFlows > 0 ? [benignCount, attackCount] : [1, 0];
    chartRef.current.update();
  }, [attackCount, benignCount, totalFlows]);

  return <canvas ref={canvasRef} />;
}
