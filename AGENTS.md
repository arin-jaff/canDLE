# canDLE — Daily Stock Guessing Game

## Concept

A daily web game where players are shown an anonymized 1-year stock price chart and must guess which publicly traded company it belongs to. Players start with a **1,000-point bankroll** and can spend points to reveal progressively more identifying clues. The fewer points spent before guessing correctly, the higher the final score. One new puzzle per day, same for all players — like Wordle.

## Core Gameplay Loop

1. Player sees a **1Y price chart** (dates hidden, only % change on Y-axis) with the stock ticker and company name obscured.
2. Player can **buy hints** by spending points from their 1,000-point bankroll.
3. At any time, player can **submit a guess** (autocomplete search against a list of ~500 well-known stocks).
4. **Correct guess** → final score = remaining points. **Wrong guess** → lose 150 points per wrong guess.
5. If bankroll hits 0, the answer is revealed and score is 0.
6. Daily results are shareable (emoji grid / score card).

## Hint Tiers & Costs

| Cost | Hint Revealed |
|------|--------------|
| Free | 1Y price chart (% change only, no dates, no price axis) |
| 50 | Reveal the **sector** (e.g., Technology, Healthcare) |
| 50 | Reveal the **market cap range** (Mega/Large/Mid/Small cap) |
| 75 | Reveal **company HQ country** |
| 75 | Reveal **1-month price chart** (more granular recent movement) |
| 100 | Reveal **5-year price chart** |
| 100 | Reveal a **one-sentence company description** (scrubbed of the company name) |
| 100 | Reveal **52-week high/low prices** (actual dollar amounts) |
| 125 | Reveal **10-year price chart** |
| 125 | Reveal **industry** (more specific than sector, e.g., "Semiconductors") |
| 150 | Reveal **IPO year** |
| 150 | Reveal **the actual price axis** on the 1Y chart (shows dollar values) |

Players choose which hints to buy in any order — strategy matters.

## Visual Design Language

**Theme: Wall Street terminal / Bloomberg aesthetic.**

- **Colors**: Pure black background (`#000000`), neon/phosphor green (`#00FF41`) as primary accent, dark gray (`#111111`, `#1a1a1a`) for card/panel backgrounds, white (`#e0e0e0`) for text, red (`#ff3538`) for negative/loss indicators.
- **Typography**: Monospace font stack — `JetBrains Mono`, `Fira Code`, or `IBM Plex Mono`. All-caps for headers. Tabular/lining numerals everywhere.
- **Shapes**: Zero border-radius on everything. Sharp corners, hard edges. 1px solid borders in dark green or gray. No shadows, no gradients — flat and stark.
- **Charts**: Thin sharp polylines (not smooth/curved). Green for positive movement, red for negative. Subtle grid lines in very dark gray. No fill under the curve — line only. Axis labels in small monospace.
- **Animations**: Minimal — charts draw in left-to-right on reveal. Hints appear with a brief flicker/scanline effect. No bouncy or playful animations.
- **Layout**: Dense, information-heavy panels. Think trading terminal tiled windows. Hints displayed in a grid of "locked" cards that unlock when purchased.
- **Overall feel**: Like you're sitting at a Bloomberg Terminal at 6 AM. Professional, dense, no-nonsense.

## Technical Architecture

### Stack

- **Frontend**: React 18+ with TypeScript, Vite bundler
- **Styling**: Tailwind CSS (with custom theme config for the terminal palette)
- **Charts**: Lightweight Charts (by TradingView) — it renders exactly the right aesthetic natively. Alternatively, D3.js or recharts with heavy customization.
- **State**: Zustand or React Context for game state (bankroll, revealed hints, guesses)
- **Data/Backend**: This is a static daily game — no real-time backend needed for MVP.

### Data Strategy (MVP)

For the MVP, pre-generate a pool of daily puzzles as static JSON:

```
/public/puzzles/2025-02-07.json
```

Each puzzle JSON contains:

```json
{
  "id": "2025-02-07",
  "answer": {
    "ticker": "NVDA",
    "name": "NVIDIA Corporation"
  },
  "charts": {
    "1y": [[0, 2.3], [1, 2.8], [2, 1.9], ...],
    "1m": [[0, 5.1], [1, 5.3], ...],
    "5y": [...],
    "10y": [...]
  },
  "hints": {
    "sector": "Technology",
    "industry": "Semiconductors",
    "marketCapRange": "Mega Cap (>$200B)",
    "hqCountry": "United States",
    "description": "Designs and manufactures graphics processing units and system-on-chip products for gaming, data centers, and AI applications.",
    "high52w": 152.89,
    "low52w": 63.31,
    "ipoYear": 1999
  }
}
```

Chart data uses **normalized indices** for X-axis (not real dates) and **percentage change from day 0** for Y-axis (so the actual price is hidden until that hint is bought). When the player buys the "reveal price axis" hint, the frontend maps percentages back to real dollar values using a `basePrice` field.

### Puzzle Generation Pipeline (Separate Script)

A Python script (`scripts/generate_puzzles.py`) that:

1. Pulls from a curated list of ~500 recognizable tickers (S&P 500 + select others).
2. Fetches historical price data from `yfinance` or Alpha Vantage.
3. Fetches company metadata (sector, industry, description, HQ, IPO year, market cap).
4. Normalizes chart data to percentage-change format.
5. Scrubs the company description of any mention of the company name or ticker.
6. Outputs one JSON file per day, with a deterministic daily seed so the same puzzle is served to everyone.
7. Keeps a log of previously used tickers to avoid repeats.

### Local Storage & Daily State

- Use `localStorage` to persist: today's game state, bankroll, revealed hints, guesses, streak count, and historical scores.
- Key format: `candle-{YYYY-MM-DD}` for daily state, `candle-stats` for aggregate stats.
- On load, check if today's puzzle has already been started/completed.

## Page Structure

### Single Page App — Three Panels

```
┌──────────────────────────────────────────────────┐
│  canDLE          [?] [📊 Stats] [⚙ Settings]   │  ← Top bar
├──────────────────────────────────────────────────┤
│                                                  │
│         ┌──────────────────────────┐             │
│         │                          │             │
│         │     PRICE CHART AREA     │             │
│         │   (main chart display)   │             │
│         │                          │             │
│         └──────────────────────────┘             │
│         [1M] [1Y] [5Y] [10Y]  ← chart tabs      │
│          🔒   ✓    🔒   🔒    (locked/unlocked)  │
│                                                  │
├──────────────────────────────────────────────────┤
│  BANKROLL: ████████████░░░ 750 / 1000            │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ SECTOR  │ │ MKT CAP │ │ HQ      │            │
│  │ 🔒 -50  │ │ 🔒 -50  │ │ 🔒 -75  │            │
│  └─────────┘ └─────────┘ └─────────┘            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ DESC    │ │ 52W H/L │ │ INDUSTRY│            │
│  │ 🔒 -100 │ │ 🔒 -100 │ │ 🔒 -125 │            │
│  └─────────┘ └─────────┘ └─────────┘            │
│  ┌─────────┐ ┌─────────┐                        │
│  │ IPO YR  │ │ $$ AXIS │                        │
│  │ 🔒 -150 │ │ 🔒 -150 │                        │
│  └─────────┘ └─────────┘                        │
│                                                  │
├──────────────────────────────────────────────────┤
│  GUESS: [___________________________] [SUBMIT]   │
│                                                  │
│  ✗ AAPL  (-150)                                  │
│  ✗ MSFT  (-150)                                  │
├──────────────────────────────────────────────────┤
│  ▓ Share your score ▓                            │
└──────────────────────────────────────────────────┘
```

### Stats Modal

- Current streak, max streak, games played, average score
- Score distribution histogram (terminal-style horizontal bar chart using block characters)
- Countdown timer to next puzzle

### Share Format

```
canDLE #142 — 650/1000
🟩🟩🟩🟩🟩🟩░░░░ 
Hints: 3 | Guesses: 1
candle.game
```

## Key Implementation Details

### Guess Input

- Autocomplete dropdown searching against the full ticker list (ticker + company name).
- Styled as a terminal input with `> ` prompt prefix and blinking cursor.
- Dropdown is dark-themed, sharp corners, highlighted row in green.

### Chart Rendering

- Default: 1Y chart showing % change. X-axis shows generic "trading days" markers. Y-axis shows % from starting point.
- When additional timeframes are unlocked, show as tabs above the chart.
- "Reveal price axis" hint replaces the % axis with actual dollar values.
- Use TradingView Lightweight Charts if possible — it gives the exact look for free. Configure with dark theme, green/red coloring, crosshair on hover.

### Mobile Responsiveness

- Single column layout on mobile.
- Hint cards in a 2-column grid.
- Chart takes full width.
- Touch-friendly tap targets on hint cards.

## File Structure

```
candle/
├── public/
│   └── puzzles/          # Pre-generated daily puzzle JSONs
├── src/
│   ├── components/
│   │   ├── Chart.tsx           # Price chart with TradingView LC
│   │   ├── ChartTabs.tsx       # Timeframe selector (1M/1Y/5Y/10Y)
│   │   ├── HintGrid.tsx        # Grid of purchasable hint cards
│   │   ├── HintCard.tsx        # Individual locked/unlocked hint
│   │   ├── GuessInput.tsx      # Autocomplete search + submit
│   │   ├── GuessList.tsx       # History of wrong guesses
│   │   ├── Bankroll.tsx        # Score/bankroll bar
│   │   ├── Header.tsx          # Top bar with title + icons
│   │   ├── StatsModal.tsx      # Stats/streak overlay
│   │   ├── ShareButton.tsx     # Generate + copy share text
│   │   ├── HowToPlayModal.tsx  # Rules explanation
│   │   └── GameOver.tsx        # Win/loss reveal screen
│   ├── hooks/
│   │   ├── useGameState.ts     # Core game logic + localStorage
│   │   └── usePuzzle.ts        # Fetch + parse daily puzzle
│   ├── data/
│   │   └── tickers.json        # Full list of valid tickers for autocomplete
│   ├── lib/
│   │   ├── scoring.ts          # Score calculation logic
│   │   └── share.ts            # Share text generation
│   ├── styles/
│   │   └── globals.css         # Base styles, font imports, terminal effects
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   ├── generate_puzzles.py     # Puzzle generation pipeline
│   └── ticker_list.csv         # Curated ticker pool
├── tailwind.config.ts
├── index.html
├── package.json
└── README.md
```

## MVP Scope

**Build these first:**

1. Static puzzle loading from JSON (hardcode 3-5 sample puzzles to start)
2. Chart rendering with the 1Y default view
3. Hint purchasing system with bankroll tracking
4. Guess input with autocomplete
5. Win/loss state + score display
6. localStorage persistence for daily state
7. Share button with clipboard copy

**Defer to v2:**

- Real puzzle generation pipeline (use hardcoded sample data for MVP)
- Backend API for puzzles (static JSON is fine for now)
- User accounts / cross-device sync
- Leaderboards
- Sound effects (terminal beep on wrong guess, ticker tape on win)
- "Hard mode" (fewer starting points, higher hint costs)

## Sample Puzzle Data (For Development)

Include at least 3 hardcoded puzzles in `public/puzzles/` for development. Use real historical data for recognizable stocks like AAPL, TSLA, NVDA, AMZN, etc. Normalize the chart data as described above. The daily puzzle is selected by date string — for dev, just map any date to one of the samples via modulo.

## Name

**canDLE** — a daily stock chart guessing game.
