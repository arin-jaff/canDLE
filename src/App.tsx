import { useEffect, useState, useCallback } from 'react';
import { usePuzzle, getPuzzleNumber } from './hooks/usePuzzle';
import { useGameStore } from './hooks/useGameState';
import { Intro } from './components/Intro';
import { MatrixRain } from './components/MatrixRain';
import { AdminPanel } from './components/AdminPanel';
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
  const { puzzle, loading, error, loadPuzzle, loadPuzzleByTicker } = usePuzzle();
  const { state, stats, init, reset, buyHint, submitGuess } = useGameStore();
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMatrixRain, setShowMatrixRain] = useState(false);
  const handleIntroComplete = useCallback(() => setShowIntro(false), []);

  useEffect(() => {
    if (puzzle) {
      init(puzzle.id);
    }
  }, [puzzle, init]);

  // Backtick key toggles admin panel
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '`' && !e.ctrlKey && !e.metaKey) {
        // Don't toggle if typing in an input
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setShowAdmin((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

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
          ERR: {error || 'FAILED TO LOAD PUZZLE DATA'}
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
    const result = submitGuess(ticker, puzzle.answer.ticker);
    if (result === 'correct') {
      setShowMatrixRain(true);
    }
  };

  const handleReset = () => {
    if (puzzle) {
      reset(puzzle.id);
      setShowAdmin(false);
    }
  };

  const handleAdminLoadPuzzle = (index: number) => {
    loadPuzzle(index);
    setShowAdmin(false);
  };

  const handleAdminLoadTicker = (ticker: string) => {
    loadPuzzleByTicker(ticker);
    setShowAdmin(false);
  };

  return (
    <div className="h-screen bg-terminal-black flex flex-col overflow-hidden">
      {showIntro && <Intro onComplete={handleIntroComplete} />}

      {showMatrixRain && (
        <MatrixRain
          onComplete={() => setShowMatrixRain(false)}
          ticker={puzzle.answer.ticker}
          score={state.bankroll}
        />
      )}

      <Header
        onShowStats={() => setShowStats(true)}
        onShowHelp={() => setShowHelp(true)}
        onShowAdmin={() => setShowAdmin(true)}
      />

      <main className="flex-1 w-full overflow-y-auto">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Panel — Chart + Bankroll */}
          <div className="flex-1 lg:border-r lg:border-terminal-border p-4 lg:p-6 space-y-3 lg:overflow-y-auto">
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

            <Bankroll bankroll={state.bankroll} />

            {/* Game Over — shown in left panel on desktop */}
            {gameOver && (
              <div className="space-y-3">
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
              </div>
            )}
          </div>

          {/* Right Panel — Hints + Guess */}
          <div className="lg:w-[420px] xl:w-[480px] p-4 lg:p-6 space-y-3 lg:overflow-y-auto border-t lg:border-t-0 border-terminal-border">
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
          </div>
        </div>
      </main>

      <footer className="border-t border-terminal-border px-4 py-1.5 text-center shrink-0">
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
      {showAdmin && (
        <AdminPanel
          currentPuzzleId={puzzle.id}
          onLoadPuzzle={handleAdminLoadPuzzle}
          onLoadTicker={handleAdminLoadTicker}
          onReset={handleReset}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}

export default App;
