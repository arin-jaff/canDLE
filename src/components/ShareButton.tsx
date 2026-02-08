import { useState } from 'react';
import { generateShareText } from '../lib/share';

interface ShareButtonProps {
  puzzleNumber: number;
  score: number;
  hintsUsed: number;
  guessCount: number;
  won: boolean;
}

export function ShareButton({ puzzleNumber, score, hintsUsed, guessCount, won }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = generateShareText(puzzleNumber, score, hintsUsed, guessCount, won);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full border border-terminal-green bg-terminal-green-dark text-terminal-green
        py-2.5 px-4 text-xs font-semibold uppercase tracking-widest
        hover:bg-terminal-green hover:text-terminal-black
        transition-colors duration-100"
    >
      {copied ? 'COPIED TO CLIPBOARD' : 'SHARE YOUR SCORE'}
    </button>
  );
}
