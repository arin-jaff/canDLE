import { useEffect, useRef } from 'react';
import { createChart, LineSeries, type IChartApi, type Time, ColorType, LineStyle } from 'lightweight-charts';

interface ChartProps {
  data: number[][];
  showPriceAxis: boolean;
  basePrice: number;
}

function anonymizeTimestamps(data: number[][]): number[][] {
  const FAKE_EPOCH = 946684800;
  const DAY = 86400;
  return data.map(([, y], i) => {
    let fakeDays = i;
    const weekends = Math.floor(fakeDays / 5) * 2;
    return [FAKE_EPOCH + (fakeDays + weekends) * DAY, y];
  });
}

export function Chart({ data, showPriceAxis, basePrice }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const container = containerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#222222' },
        textColor: '#5C85A6',
        fontFamily: 'Roboto Mono, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#2E2E2E', style: LineStyle.Solid },
        horzLines: { color: '#2E2E2E', style: LineStyle.Solid },
      },
      crosshair: {
        vertLine: { color: '#FF9900', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#282828' },
        horzLine: { color: '#FF9900', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#282828' },
      },
      rightPriceScale: {
        borderColor: '#3A3A3A',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#3A3A3A',
        visible: true,
        tickMarkFormatter: () => '',
      },
      handleScroll: false,
      handleScale: false,
      localization: { timeFormatter: () => '' },
    });

    const isPositive = data.length > 1 && data[data.length - 1][1] >= data[0][1];
    const lineColor = isPositive ? '#00C853' : '#FF5252';

    const series = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      crosshairMarkerBackgroundColor: '#FF9900',
      crosshairMarkerBorderColor: '#FF9900',
      crosshairMarkerRadius: 3,
      priceFormat: showPriceAxis
        ? { type: 'price', precision: 2, minMove: 0.01 }
        : { type: 'custom', formatter: (price: number) => `${price >= 0 ? '+' : ''}${price.toFixed(1)}%` },
    });

    const anonymized = anonymizeTimestamps(data);
    const chartData = anonymized.map(([x, y]) => ({
      time: x as unknown as Time,
      value: showPriceAxis ? basePrice * (1 + y / 100) : y,
    }));

    series.setData(chartData);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (container) chart.applyOptions({ width: container.clientWidth });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chartRef.current = null;
      chart.remove();
    };
  }, [data, showPriceAxis, basePrice]);

  return (
    <div
      ref={containerRef}
      className="w-full border border-terminal-border"
      style={{ height: '320px' }}
    />
  );
}
