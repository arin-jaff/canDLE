import { useEffect, useRef, useState } from 'react';

interface MatrixRainProps {
  onComplete: () => void;
  ticker: string;
  score: number;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$%&@#!?./:;+=<>{}[]|~^';

export function MatrixRain({ onComplete, ticker, score }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let running = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(0).map(() => Math.random() * -50);
    const speeds: number[] = new Array(columns).fill(0).map(() => 0.3 + Math.random() * 0.7);
    const chars: string[] = new Array(columns).fill('');

    // Show the result text after 1.5s
    const resultTimer = setTimeout(() => setShowResult(true), 1500);
    // Auto-dismiss after 4s
    const dismissTimer = setTimeout(() => {
      running = false;
      onComplete();
    }, 4500);

    const draw = () => {
      if (!running) return;

      ctx.fillStyle = 'rgba(26, 26, 26, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        chars[i] = char;

        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Head of the stream — bright amber
        ctx.fillStyle = '#FF9900';
        ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        ctx.fillText(char, x, y);

        // Trail character slightly behind — dimmer
        if (drops[i] > 1) {
          ctx.fillStyle = 'rgba(255, 153, 0, 0.4)';
          ctx.fillText(
            CHARS[Math.floor(Math.random() * CHARS.length)],
            x,
            (drops[i] - 1) * fontSize
          );
        }

        // Even more behind — very dim
        if (drops[i] > 3) {
          ctx.fillStyle = 'rgba(255, 153, 0, 0.15)';
          ctx.fillText(
            CHARS[Math.floor(Math.random() * CHARS.length)],
            x,
            (drops[i] - 3) * fontSize
          );
        }

        drops[i] += speeds[i];

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = Math.random() * -20;
          speeds[i] = 0.3 + Math.random() * 0.7;
        }
      }

      animFrame = requestAnimationFrame(draw);
    };

    animFrame = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(animFrame);
      clearTimeout(resultTimer);
      clearTimeout(dismissTimer);
      window.removeEventListener('resize', resize);
    };
  }, [onComplete, ticker, score]);

  return (
    <div
      className="fixed inset-0 z-[200] cursor-pointer"
      onClick={onComplete}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Result overlay */}
      <div
        className={`
          absolute inset-0 flex flex-col items-center justify-center
          transition-opacity duration-700
          ${showResult ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <div className="bg-terminal-black/80 border border-terminal-green p-8 text-center">
          <div className="text-[10px] text-terminal-muted tracking-[0.5em] uppercase mb-2">
            CORRECT
          </div>
          <div className="text-5xl font-mono font-bold text-terminal-green mb-2">
            {ticker}
          </div>
          <div className="text-2xl font-mono text-terminal-text">
            {score} <span className="text-terminal-muted text-sm">PTS</span>
          </div>
          <div className="text-[10px] text-terminal-muted mt-4 tracking-widest">
            CLICK ANYWHERE TO CONTINUE
          </div>
        </div>
      </div>
    </div>
  );
}
