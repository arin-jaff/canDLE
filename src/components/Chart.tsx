import { useEffect, useRef } from 'react';
import { createChart, LineSeries, type IChartApi, type ISeriesApi, type Time, ColorType, LineStyle } from 'lightweight-charts';

interface ChartProps {
  data: number[][];
  showPriceAxis: boolean;
  basePrice: number;
}

export function Chart({ data, showPriceAxis, basePrice }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#666666',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1a1a1a', style: LineStyle.Solid },
        horzLines: { color: '#1a1a1a', style: LineStyle.Solid },
      },
      crosshair: {
        vertLine: { color: '#00FF41', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#111111' },
        horzLine: { color: '#00FF41', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#111111' },
      },
      rightPriceScale: {
        borderColor: '#1a1a1a',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#1a1a1a',
        timeVisible: false,
        secondsVisible: false,
      },
      handleScroll: false,
      handleScale: false,
    });

    const isPositive = data.length > 1 && data[data.length - 1][1] >= data[0][1];
    const lineColor = isPositive ? '#00FF41' : '#ff3538';

    const series = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      crosshairMarkerBackgroundColor: lineColor,
      crosshairMarkerBorderColor: lineColor,
      crosshairMarkerRadius: 3,
      priceFormat: showPriceAxis
        ? { type: 'price', precision: 2, minMove: 0.01 }
        : { type: 'custom', formatter: (price: number) => `${price >= 0 ? '+' : ''}${price.toFixed(1)}%` },
    });

    const chartData = data.map(([x, y]) => ({
      time: x as unknown as Time,
      value: showPriceAxis ? basePrice * (1 + y / 100) : y,
    }));

    series.setData(chartData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
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
