#!/usr/bin/env python3
"""Fetch real stock data and generate puzzle JSONs for canDLE.

Usage:
  python3 scripts/generate_puzzles.py              # Generate all 3 sample puzzles
  python3 scripts/generate_puzzles.py MSFT          # Generate a single ticker puzzle
  python3 scripts/generate_puzzles.py MSFT AMZN GOOG  # Generate multiple tickers
"""

import json
import math
import os
import sys
import time
import requests
import yfinance as yf


def sanitize_float(v, default=0):
    """Convert a value to a JSON-safe float. NaN/Infinity → default."""
    if v is None:
        return default
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (TypeError, ValueError):
        return default


class SafeJSONEncoder(json.JSONEncoder):
    """JSON encoder that converts NaN/Infinity to null instead of crashing."""
    def default(self, o):
        return super().default(o)

    def encode(self, o):
        return super().encode(self._sanitize(o))

    def _sanitize(self, o):
        if isinstance(o, float):
            if math.isnan(o) or math.isinf(o):
                return 0
            return o
        if isinstance(o, dict):
            return {k: self._sanitize(v) for k, v in o.items()}
        if isinstance(o, (list, tuple)):
            return [self._sanitize(v) for v in o]
        return o

PUZZLES = [
    {
        "id": "sample-0",
        "ticker": "NVDA",
        "name": "NVIDIA Corporation",
        "hints": {
            "sector": "Technology",
            "industry": "Semiconductors",
            "marketCapRange": "Mega Cap (>$200B)",
            "hqCountry": "United States",
            "description": "Designs and manufactures graphics processing units and system-on-chip products for gaming, data centers, and AI applications.",
            "ipoYear": 1999,
        },
    },
    {
        "id": "sample-1",
        "ticker": "TSLA",
        "name": "Tesla, Inc.",
        "hints": {
            "sector": "Consumer Discretionary",
            "industry": "Automobile Manufacturers",
            "marketCapRange": "Mega Cap (>$200B)",
            "hqCountry": "United States",
            "description": "Designs, develops, manufactures, and sells fully electric vehicles, energy generation and storage systems, and related services worldwide.",
            "ipoYear": 2010,
        },
    },
    {
        "id": "sample-2",
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "hints": {
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "marketCapRange": "Mega Cap (>$200B)",
            "hqCountry": "United States",
            "description": "Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. Also operates digital content stores and streaming services.",
            "ipoYear": 1980,
        },
    },
]

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "puzzles")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


def generate_description_gemini(
    ticker: str, name: str, sector: str, industry: str,
    country: str = "", ipo_year: int | None = None,
) -> dict | None:
    """Use Gemini to generate a company description + 2 fun facts with giveaway words redacted.

    Returns dict with keys: description, funFact1, funFact2 — or None on failure.
    """
    if not GEMINI_API_KEY:
        print("  No GEMINI_API_KEY set, skipping AI description")
        return None

    prompt = f"""You are generating hints for a stock guessing game called canDLE. Players see an anonymized stock chart and buy hints to guess the company ticker.

Generate the following for {name} (ticker: {ticker}):

1. DESCRIPTION: A 2-3 sentence description of what the company does, its products, services, and why it is notable. Be specific and helpful.

2. FUN FACT 1: A surprising, interesting, or little-known fact about the company. Could be about its history, culture, records, quirky origins, etc.

3. FUN FACT 2: Another different fun fact. Try to pick something from a different angle than fact 1.

ONLY redact words that would IMMEDIATELY give away the answer. Replace each redacted word with asterisks matching its character count:
- The company name or any part of it (e.g., "Apple" → "*****")
- The ticker symbol (e.g., "TSLA" → "****")
- Flagship product names that are uniquely associated with the company (e.g., "iPhone" → "******", "Windows" → "*******", "Big Mac" → "*** ***")

Do NOT redact:
- General descriptions of what the company does
- CEO/founder names — these are fair game as clues
- Subsidiary or brand names that aren't dead giveaways
- Industry terms, business metrics, or general facts

Return EXACTLY in this format (3 lines, each starting with the label):
DESCRIPTION: <your description here>
FUN FACT 1: <your fun fact here>
FUN FACT 2: <your fun fact here>

No quotes, no extra explanation."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemma-3-12b-it:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 500,
        },
    }

    for attempt in range(3):
        try:
            resp = requests.post(url, json=payload, timeout=45)
            if resp.status_code == 429:
                wait = 5 * (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            result = resp.json()
            text = result["candidates"][0]["content"]["parts"][0]["text"]
            text = text.strip().strip('"').strip()

            # Parse the structured response
            description = ""
            fun_fact_1 = ""
            fun_fact_2 = ""
            for line in text.split("\n"):
                line = line.strip()
                if line.upper().startswith("DESCRIPTION:"):
                    description = line[len("DESCRIPTION:"):].strip()
                elif line.upper().startswith("FUN FACT 1:"):
                    fun_fact_1 = line[len("FUN FACT 1:"):].strip()
                elif line.upper().startswith("FUN FACT 2:"):
                    fun_fact_2 = line[len("FUN FACT 2:"):].strip()

            if not description:
                # Fallback: treat the entire text as description
                description = text

            print(f"  Gemini description: {description[:80]}...")
            if fun_fact_1:
                print(f"  Fun fact 1: {fun_fact_1[:60]}...")
            if fun_fact_2:
                print(f"  Fun fact 2: {fun_fact_2[:60]}...")

            return {
                "description": description,
                "funFact1": fun_fact_1 or "This company has an interesting history in its industry.",
                "funFact2": fun_fact_2 or "The company has made significant contributions to its sector.",
            }
        except Exception as e:
            print(f"  Gemini API error: {e}")
            if attempt < 2:
                time.sleep(3)
    return None


def generate_difficulty_gemini(ticker: str, name: str, sector: str, industry: str) -> int:
    """Ask Gemini to rate puzzle difficulty 1-5 based on how widely known the stock is."""
    if not GEMINI_API_KEY:
        return 3  # default medium

    prompt = f"""Rate how difficult it would be for an average retail investor to identify this stock in a guessing game, on a scale of 1 to 5:

1 = Very Easy (household name, in the news constantly — e.g., Apple, Tesla, Amazon)
2 = Easy (well-known large cap, most investors would recognize — e.g., Nike, Disney, Coca-Cola)
3 = Medium (known to active investors but not general public — e.g., Broadcom, Thermo Fisher)
4 = Hard (niche or B2B company, mainly known to sector specialists — e.g., Verisign, Rollins)
5 = Very Hard (obscure S&P 500 member, most people have never heard of it — e.g., NRG Energy, Paycom)

Stock: {name} (ticker: {ticker})
Sector: {sector}
Industry: {industry}

Reply with ONLY a single digit: 1, 2, 3, 4, or 5. No explanation."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemma-3-12b-it:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 10},
    }

    try:
        resp = requests.post(url, json=payload, timeout=30)
        if resp.status_code == 429:
            print("  Difficulty rating rate-limited, defaulting to 3")
            return 3
        resp.raise_for_status()
        result = resp.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
        digit = int(text[0])
        if 1 <= digit <= 5:
            print(f"  Difficulty: {digit}/5")
            return digit
    except Exception as e:
        print(f"  Difficulty rating failed: {e}")
    return 3


def classify_market_cap(cap: float) -> str:
    if cap >= 200e9:
        return "Mega Cap (>$200B)"
    elif cap >= 10e9:
        return "Large Cap ($10B-$200B)"
    elif cap >= 2e9:
        return "Mid Cap ($2B-$10B)"
    else:
        return "Small Cap (<$2B)"


def fetch_chart_data(ticker: str, period: str):
    """Fetch historical OHLC data and return as [[ts, open%, high%, low%, close%], ...] + base_price."""
    stock = yf.Ticker(ticker)
    hist = stock.history(period=period)
    if hist.empty:
        return [], 0

    # Drop rows with NaN close prices
    hist = hist.dropna(subset=["Close"])
    if hist.empty:
        return [], 0

    base_price = sanitize_float(hist["Close"].iloc[0])
    if base_price == 0:
        return [], 0

    result = []
    for date, row in hist.iterrows():
        o = sanitize_float(row.get("Open", row["Close"]))
        h = sanitize_float(row.get("High", row["Close"]))
        l = sanitize_float(row.get("Low", row["Close"]))
        c = sanitize_float(row["Close"])
        if c == 0:
            continue
        ts = int(date.timestamp())
        o_pct = round(((o - base_price) / base_price) * 100, 2)
        h_pct = round(((h - base_price) / base_price) * 100, 2)
        l_pct = round(((l - base_price) / base_price) * 100, 2)
        c_pct = round(((c - base_price) / base_price) * 100, 2)
        result.append([ts, o_pct, h_pct, l_pct, c_pct])
    return result, base_price


def get_52w_high_low(ticker: str):
    stock = yf.Ticker(ticker)
    hist = stock.history(period="1y")
    if hist.empty:
        return 0, 0
    high = sanitize_float(hist["High"].max())
    low = sanitize_float(hist["Low"].min())
    return round(high, 2), round(low, 2)


def generate_puzzle(puzzle_def: dict) -> dict:
    ticker = puzzle_def["ticker"]
    print(f"Fetching data for {ticker}...")

    charts = {}
    base_prices = {}

    for period_key, yf_period in [("1y", "1y"), ("1m", "1mo"), ("5y", "5y"), ("10y", "max")]:
        try:
            data, bp = fetch_chart_data(ticker, yf_period)
            charts[period_key] = data
            base_prices[period_key] = round(bp, 2)
        except Exception as e:
            print(f"  Warning: failed to fetch {period_key} for {ticker}: {e}")
            charts[period_key] = []
            base_prices[period_key] = 0

    high52w, low52w = get_52w_high_low(ticker)

    hints = dict(puzzle_def["hints"])
    hints["high52w"] = high52w
    hints["low52w"] = low52w

    return {
        "id": puzzle_def["id"],
        "answer": {"ticker": ticker, "name": puzzle_def["name"]},
        "basePrice": base_prices.get("1m", 0),
        "basePrices": base_prices,
        "charts": charts,
        "hints": hints,
    }


def generate_from_ticker(ticker: str) -> dict:
    """Auto-generate a puzzle for any ticker by pulling metadata from yfinance."""
    ticker = ticker.upper()
    print(f"Auto-generating puzzle for {ticker}...")

    stock = yf.Ticker(ticker)
    info = stock.info

    name = info.get("longName") or info.get("shortName") or ticker
    sector = info.get("sector", "Unknown")
    industry = info.get("industry", "Unknown")
    country = info.get("country", "Unknown")
    market_cap = info.get("marketCap", 0)
    market_cap_range = classify_market_cap(market_cap)

    ipo_year = None
    try:
        from datetime import datetime, timezone
        first_trade = info.get("firstTradeDateEpochUtc")
        if first_trade:
            ipo_year = datetime.fromtimestamp(first_trade, tz=timezone.utc).year
        else:
            first_trade_ms = info.get("firstTradeDateMilliseconds")
            if first_trade_ms:
                ipo_year = datetime.fromtimestamp(first_trade_ms / 1000, tz=timezone.utc).year
    except Exception:
        pass

    # Try Gemini for a smart redacted description + fun facts
    gemini_result = generate_description_gemini(
        ticker, name, sector, industry, country, ipo_year
    )

    if gemini_result:
        description = gemini_result["description"]
        fun_fact_1 = gemini_result["funFact1"]
        fun_fact_2 = gemini_result["funFact2"]
    else:
        # Fallback: basic description from yfinance
        raw = info.get("longBusinessSummary", "")
        if raw:
            sentences = raw.split(". ")
            description = sentences[0] + "."
            description = description.replace(name, "The company")
            description = description.replace(ticker, "[TICKER]")
        else:
            description = "A publicly traded company."
        fun_fact_1 = ""
        fun_fact_2 = ""

    # Get difficulty rating from Gemini
    difficulty = generate_difficulty_gemini(ticker, name, sector, industry)

    puzzle_def = {
        "id": ticker.lower(),
        "ticker": ticker,
        "name": name,
        "hints": {
            "sector": sector,
            "industry": industry,
            "marketCapRange": market_cap_range,
            "hqCountry": country,
            "description": description,
            "funFact1": fun_fact_1,
            "funFact2": fun_fact_2,
            "ipoYear": ipo_year or 2000,
        },
    }

    result = generate_puzzle(puzzle_def)
    result["difficulty"] = difficulty
    return result


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # If tickers passed as CLI args, generate those
    if len(sys.argv) > 1:
        tickers = sys.argv[1:]
        for i, ticker in enumerate(tickers):
            try:
                puzzle = generate_from_ticker(ticker)
                for key, data in puzzle["charts"].items():
                    print(f"  {key}: {len(data)} data points")

                path = os.path.join(OUTPUT_DIR, f"{ticker.lower()}.json")
                with open(path, "w") as f:
                    json.dump(puzzle, f, indent=2, cls=SafeJSONEncoder)
                print(f"  Wrote {path}")
            except Exception as e:
                print(f"  ERROR generating {ticker}: {e}")
            # Brief pause between tickers to avoid rate limits
            if i < len(tickers) - 1 and GEMINI_API_KEY:
                time.sleep(2)
        print("\nDone!")
        return

    # Default: generate sample puzzles
    for puzzle_def in PUZZLES:
        puzzle = generate_puzzle(puzzle_def)

        for key, data in puzzle["charts"].items():
            print(f"  {key}: {len(data)} data points")

        path = os.path.join(OUTPUT_DIR, f"{puzzle_def['id']}.json")
        with open(path, "w") as f:
            json.dump(puzzle, f, indent=2, cls=SafeJSONEncoder)
        print(f"  Wrote {path}")

    print("\nDone!")


if __name__ == "__main__":
    main()
