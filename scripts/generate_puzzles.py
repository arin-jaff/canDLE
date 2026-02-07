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


def generate_description_gemini(ticker: str, name: str, sector: str, industry: str) -> str | None:
    """Use Gemini to generate a company description with giveaway words redacted as asterisks."""
    if not GEMINI_API_KEY:
        print("  No GEMINI_API_KEY set, skipping AI description")
        return None

    prompt = f"""You are generating a hint for a stock guessing game called canDLE. Players see an anonymized stock chart and buy hints to guess the company ticker.

Generate a 2-3 sentence description of {name} (ticker: {ticker}, sector: {sector}, industry: {industry}).

The description should be helpful and informative — giving clues about what the company does, its history, or notable facts — but with ALL giveaway words replaced by asterisks matching the EXACT character count of each replaced word.

Words you MUST redact (replace with asterisks equal to character count):
- The company name or any part of it (e.g., "Apple" → "*****", "Microsoft" → "*********")
- The ticker symbol (e.g., "TSLA" → "****")
- Founder/CEO names (e.g., "Elon Musk" → "**** ****", "Jeff Bezos" → "**** *****")
- Flagship product or service names that immediately identify the company (e.g., "iPhone" → "******", "Windows" → "*******", "Gmail" → "*****")
- Well-known brand names, subsidiaries, or acquisitions that are dead giveaways

Words you must NOT redact:
- Generic industry terms (electric vehicles, cloud computing, social media, semiconductors, streaming)
- Country or city names
- General business terms (revenue, market share, founded, headquartered)
- Years and numbers

Return ONLY the final redacted description. No quotes, no explanation, no preamble.

Example output for a hypothetical company:
Founded in 2004, this social media company operates the world's largest online social networking platform with over 3 billion monthly active users. The company, led by CEO **** **********, also owns popular messaging and photo-sharing apps including ********* and ********."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 300,
        },
    }

    for attempt in range(3):
        try:
            resp = requests.post(url, json=payload, timeout=20)
            if resp.status_code == 429:
                wait = 5 * (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            result = resp.json()
            text = result["candidates"][0]["content"]["parts"][0]["text"]
            desc = text.strip().strip('"').strip()
            print(f"  Gemini description: {desc[:80]}...")
            return desc
        except Exception as e:
            print(f"  Gemini API error: {e}")
            if attempt < 2:
                time.sleep(3)
    return None


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
    """Fetch historical data and return as [[unix_timestamp, pct_change], ...] + base_price."""
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
        close = sanitize_float(row["Close"])
        if close == 0:
            continue
        ts = int(date.timestamp())
        pct = ((close - base_price) / base_price) * 100
        result.append([ts, round(pct, 2)])
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
    base_price = 0

    for period_key, yf_period in [("1y", "1y"), ("1m", "1mo"), ("5y", "5y"), ("10y", "10y")]:
        try:
            data, bp = fetch_chart_data(ticker, yf_period)
            charts[period_key] = data
            if period_key == "1y":
                base_price = bp
        except Exception as e:
            print(f"  Warning: failed to fetch {period_key} for {ticker}: {e}")
            charts[period_key] = []

    high52w, low52w = get_52w_high_low(ticker)

    hints = dict(puzzle_def["hints"])
    hints["high52w"] = high52w
    hints["low52w"] = low52w

    return {
        "id": puzzle_def["id"],
        "answer": {"ticker": ticker, "name": puzzle_def["name"]},
        "basePrice": round(base_price, 2),
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

    # Try Gemini for a smart redacted description
    description = generate_description_gemini(ticker, name, sector, industry)

    # Fallback: basic description from yfinance
    if not description:
        raw = info.get("longBusinessSummary", "")
        if raw:
            sentences = raw.split(". ")
            description = sentences[0] + "."
            description = description.replace(name, "The company")
            description = description.replace(ticker, "[TICKER]")
        else:
            description = f"A publicly traded company in the {sector} sector."

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
            "ipoYear": ipo_year or 2000,
        },
    }

    return generate_puzzle(puzzle_def)


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
