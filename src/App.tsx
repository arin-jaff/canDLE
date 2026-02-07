import { useEffect, useState } from 'react';
import { usePuzzle, getPuzzleNumber } from './hooks/usePuzzle';
import { useGameStore } from './hooks/useGameState';
import { Header } from './components/Header';
import { Chart } from './components/Chart';
import { ChartTabs } from './components/ChartTabs';
import { Bankroll } from './components/Bankroll';
import { HintGrid } from './components/HintGrid';
import { GuessInput } from './components/GuessInput';
import { GuessList } from './components/GuessList';
import { GameOver } from './components/GameOver';
import { ShareButton } from './components/ShareButton';
import { StatsModal } from './components/StatsModal';
import { HowToPlayModal } from './components/HowToPlayModal';

function App() {
  const { puzzle, loading, error } = usePuzzle();
  const { state, stats, init, buyHint, submitGuess } = useGameStore();
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (puzzle) {
      init(puzzle.id);
    }
  }, [puzzle, init]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-terminal-black">
        <div className="text-terminal-green text-sm font-mono animate-pulse">
          LOADING MARKET DATA...
        </div>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="h-screen flex items-center justify-center bg-terminal-black">
        <div className="text-terminal-red text-sm font-mono">
          ERR: FAILED TO LOAD PUZZLE DATA
        </div>
      </div>
    );
  }

  const gameOver = state.won || state.lost;
  const activeChartData = puzzle.charts[state.activeChart];
  const showPriceAxis = state.revealedHints.includes('priceAxis');
  const puzzleNumber = getPuzzleNumber();

  const handleBuyHint = (hintId: string) => {
    buyHint(hintId);
  };

  const handleGuess = (ticker: string) => {
    submitGuess(ticker, puzzle.answer.ticker);
  };

  return (
    <div className="min-h-screen bg-terminal-black flex flex-col">
      <Header onShowStats={() => setShowStats(true)} onShowHelp={() => setShowHelp(true)} />

      <main className="flex-1 w-full max-w-2xl mx-auto p-4 space-y-3">
        {/* Chart */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-terminal-muted tracking-widest uppercase">
              PRICE CHART — {state.activeChart.toUpperCase()} VIEW
            </span>
            {showPriceAxis && (
              <span className="text-[10px] text-terminal-green tracking-widest">
                $ AXIS
              </span>
            )}
          </div>
          <Chart
            data={activeChartData}
            showPriceAxis={showPriceAxis}
            basePrice={puzzle.basePrice}
          />
          <ChartTabs />
        </div>

        {/* Bankroll */}
        <Bankroll bankroll={state.bankroll} />

        {/* Game Over State */}
        {gameOver && (
          <>
            <GameOver
              won={state.won}
              bankroll={state.bankroll}
              answer={puzzle.answer}
              guessCount={state.guesses.length}
              hintsUsed={state.revealedHints.length}
            />
            <ShareButton
              puzzleNumber={puzzleNumber}
              score={state.won ? state.bankroll : 0}
              hintsUsed={state.revealedHints.length}
              guessCount={state.guesses.length}
              won={state.won}
            />
          </>
        )}

        {/* Hints */}
        <div>
          <div className="text-[10px] text-terminal-muted tracking-widest uppercase mb-1">
            INTELLIGENCE — BUY HINTS
          </div>
          <HintGrid
            puzzle={puzzle}
            revealedHints={state.revealedHints}
            bankroll={state.bankroll}
            disabled={gameOver}
            onBuyHint={handleBuyHint}
          />
        </div>

        {/* Guess Input */}
        <div>
          <div className="text-[10px] text-terminal-muted tracking-widest uppercase mb-1">
            SUBMIT GUESS
          </div>
          <GuessInput
            onSubmit={handleGuess}
            disabled={gameOver}
            previousGuesses={state.guesses}
          />
          <GuessList
            guesses={state.guesses}
            correctTicker={puzzle.answer.ticker}
            won={state.won}
          />
        </div>
      </main>

      <footer className="border-t border-terminal-border px-4 py-2 text-center">
        <span className="text-[9px] text-terminal-border tracking-widest uppercase">
          canDLE #{puzzleNumber} — {new Date().toISOString().split('T')[0]}
        </span>
      </footer>

      {/* Modals */}
      {showStats && (
        <StatsModal stats={stats} onClose={() => setShowStats(false)} />
      )}
      {showHelp && (
        <HowToPlayModal onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}

export default App;
