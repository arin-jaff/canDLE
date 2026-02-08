import { useState, useEffect } from 'react';

interface IntroProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  { text: 'canDLE TERMINAL v1.0.0', delay: 0 },
  { text: '================================', delay: 150 },
  { text: '', delay: 250 },
  { text: 'INIT MARKET DATA FEED...........OK', delay: 350 },
  { text: 'LOADING HISTORICAL PRICES.......OK', delay: 600 },
  { text: 'CONNECTING TO EXCHANGE..........OK', delay: 850 },
  { text: 'DECRYPTING DAILY PUZZLE.........OK', delay: 1100 },
  { text: 'CALIBRATING CHART ENGINE........OK', delay: 1350 },
  { text: '', delay: 1500 },
  { text: 'ALL SYSTEMS NOMINAL', delay: 1600 },
  { text: 'STARTING SESSION...', delay: 1800 },
];

export function Intro({ onComplete }: IntroProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
        }, line.delay)
      );
    });

    // Start fade out
    timers.push(
      setTimeout(() => {
        setFading(true);
      }, 2200)
    );

    // Complete
    timers.push(
      setTimeout(() => {
        onComplete();
      }, 2800)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className={`
        fixed inset-0 z-[100] bg-terminal-black flex items-center justify-center
        transition-opacity duration-500
        ${fading ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #FF9900 2px, #FF9900 3px)',
        }}
      />

      <div className="w-full max-w-lg px-8">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="text-4xl font-bold tracking-widest mb-1">
            <span className="text-terminal-text">can</span>
            <span className="text-terminal-green">DLE</span>
          </div>
          <div className="text-[10px] text-terminal-muted tracking-[0.3em] uppercase">
            DAILY STOCK CHART GAME
          </div>
        </div>

        {/* Boot log */}
        <div className="border border-terminal-border bg-terminal-dark p-4 font-mono text-xs space-y-0.5">
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} className="flex">
              {line.text === '' ? (
                <div className="h-3" />
              ) : line.text.includes('OK') ? (
                <>
                  <span className="text-terminal-muted">
                    {line.text.replace('OK', '')}
                  </span>
                  <span className="text-terminal-green font-semibold">OK</span>
                </>
              ) : line.text === 'ALL SYSTEMS NOMINAL' ? (
                <span className="text-terminal-green font-semibold">{line.text}</span>
              ) : line.text.startsWith('===') ? (
                <span className="text-terminal-border">{line.text}</span>
              ) : line.text === 'STARTING SESSION...' ? (
                <span className="text-terminal-green animate-pulse">{line.text}</span>
              ) : (
                <span className="text-terminal-green">{line.text}</span>
              )}
            </div>
          ))}
          {visibleLines < BOOT_LINES.length && (
            <span className="text-terminal-green animate-blink">_</span>
          )}
        </div>
      </div>
    </div>
  );
}
