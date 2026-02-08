interface HowToPlayModalProps {
  onClose: () => void;
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-md border border-terminal-border bg-terminal-black mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-terminal-border px-4 py-3 bg-terminal-dark">
          <span className="text-[11px] text-terminal-muted tracking-widest uppercase font-medium">HOW TO PLAY</span>
          <button
            onClick={onClose}
            className="text-terminal-muted hover:text-terminal-green text-sm"
          >
            [X]
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs text-terminal-text leading-relaxed">
          <div>
            <div className="text-[10px] text-terminal-green font-semibold tracking-widest uppercase mb-1">OBJECTIVE</div>
            <p className="text-terminal-muted">
              Identify the stock from its anonymized price chart. You start with 1,000 points.
              The fewer points you spend, the higher your score.
            </p>
          </div>

          <div>
            <div className="text-[10px] text-terminal-green font-semibold tracking-widest uppercase mb-1">HINTS</div>
            <p className="text-terminal-muted">
              Buy hints to reveal clues about the stock: sector, market cap, HQ country,
              additional charts, company description, and more. Each hint costs 25–300 points.
            </p>
          </div>

          <div>
            <div className="text-[10px] text-terminal-green font-semibold tracking-widest uppercase mb-1">GUESSING</div>
            <p className="text-terminal-muted">
              Submit your guess using the search input. Each wrong guess costs 150 points.
              If your bankroll hits 0, the answer is revealed and your score is 0.
            </p>
          </div>

          <div>
            <div className="text-[10px] text-terminal-green font-semibold tracking-widest uppercase mb-1">SCORING</div>
            <p className="text-terminal-muted">
              Your final score equals your remaining bankroll when you guess correctly.
              A perfect score of 1,000 means you guessed it with no hints and no wrong guesses.
            </p>
          </div>

          <div>
            <div className="text-[10px] text-terminal-green font-semibold tracking-widest uppercase mb-1">DAILY</div>
            <p className="text-terminal-muted">
              One new puzzle every day, same for all players. Share your results with friends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
