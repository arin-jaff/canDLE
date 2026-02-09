import { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, CandlestickSeries, type IChartApi, type Time, ColorType, LineStyle } from 'lightweight-charts';

interface ChartProps {
  data: number[][];
  showPriceAxis: boolean;
  basePrice: number;
}

function anonymizeTimestamps(data: number[][]): number[][] {
  const FAKE_EPOCH = 946684800;
  const DAY = 86400;
  return data.map((row, i) => {
    const fakeDays = i;
    const weekends = Math.floor(fakeDays / 5) * 2;
    return [FAKE_EPOCH + (fakeDays + weekends) * DAY, ...row.slice(1)];
  });
}

/** Check if data has OHLC (5 elements per row) or just close (2 elements) */
function hasOHLC(data: number[][]): boolean {
  return data.length > 0 && data[0].length >= 5;
}

export function Chart({ data, showPriceAxis, basePrice }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [mode, setMode] = useState<'candle' | 'line'>('candle');

  const ohlcAvailable = hasOHLC(data);
  // Fall back to line if no OHLC data
  const effectiveMode = ohlcAvailable ? mode : 'line';

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

    const anonymized = anonymizeTimestamps(data);

    // Get close value (last element in each row)
    const getClose = (row: number[]) => row[row.length - 1];
    const isPositive = data.length > 1 && getClose(data[data.length - 1]) >= getClose(data[0]);

    const priceFormat = showPriceAxis
      ? { type: 'price' as const, precision: 2, minMove: 0.01 }
      : { type: 'custom' as const, formatter: (price: number) => `${price >= 0 ? '+' : ''}${price.toFixed(1)}%` };

    const toPrice = (pct: number) => showPriceAxis ? basePrice * (1 + pct / 100) : pct;

    if (effectiveMode === 'candle' && ohlcAvailable) {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#00C853',
        downColor: '#FF5252',
        borderUpColor: '#00C853',
        borderDownColor: '#FF5252',
        wickUpColor: '#00C853',
        wickDownColor: '#FF5252',
        priceFormat,
      });

      const candleData = anonymized.map((row) => ({
        time: row[0] as unknown as Time,
        open: toPrice(row[1]),
        high: toPrice(row[2]),
        low: toPrice(row[3]),
        close: toPrice(row[4]),
      }));

      series.setData(candleData);
    } else {
      const lineColor = isPositive ? '#00C853' : '#FF5252';
      const series = chart.addSeries(LineSeries, {
        color: lineColor,
        lineWidth: 2,
        crosshairMarkerBackgroundColor: '#FF9900',
        crosshairMarkerBorderColor: '#FF9900',
        crosshairMarkerRadius: 3,
        priceFormat,
      });

      // Use close value (last element in row)
      const lineData = anonymized.map((row) => ({
        time: row[0] as unknown as Time,
        value: toPrice(getClose(row)),
      }));

      series.setData(lineData);
    }

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
  }, [data, showPriceAxis, basePrice, effectiveMode, ohlcAvailable]);

  return (
    <div>
      <div
        ref={containerRef}
        className="w-full border border-terminal-border"
        style={{ height: '320px' }}
      />
      {ohlcAvailable && (
        <div className="flex border border-terminal-border border-t-0 bg-terminal-dark">
          <button
            onClick={() => setMode('candle')}
            className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider transition-colors border-r border-terminal-border
              ${effectiveMode === 'candle'
                ? 'text-terminal-green bg-terminal-green-dark/30'
                : 'text-terminal-muted hover:text-terminal-text'
              }`}
          >
            CANDLE
          </button>
          <button
            onClick={() => setMode('line')}
            className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider transition-colors
              ${effectiveMode === 'line'
                ? 'text-terminal-green bg-terminal-green-dark/30'
                : 'text-terminal-muted hover:text-terminal-text'
              }`}
          >
            LINE
          </button>
        </div>
      )}
    </div>
  );
}
