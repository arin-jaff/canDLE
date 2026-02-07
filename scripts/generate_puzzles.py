#!/usr/bin/env python3
"""Fetch real stock data and generate puzzle JSONs for canDLE.

Usage:
  python3 scripts/generate_puzzles.py              # Generate all 3 sample puzzles
  python3 scripts/generate_puzzles.py MSFT          # Generate a single ticker puzzle
  python3 scripts/generate_puzzles.py MSFT AMZN GOOG  # Generate multiple tickers
"""

import json
import os
import sys
import yfinance as yf

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

    base_price = float(hist["Close"].iloc[0])
    result = []
    for date, row in hist.iterrows():
        ts = int(date.timestamp())
        pct = ((float(row["Close"]) - base_price) / base_price) * 100
        result.append([ts, round(pct, 2)])
    return result, base_price


def get_52w_high_low(ticker: str):
    stock = yf.Ticker(ticker)
    hist = stock.history(period="1y")
    if hist.empty:
        return 0, 0
    return round(float(hist["High"].max()), 2), round(float(hist["Low"].min()), 2)


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

    # Build description, strip company name from it
    description = info.get("longBusinessSummary", "")
    if description:
        # Truncate to ~1 sentence and strip the company name
        sentences = description.split(". ")
        description = sentences[0] + "."
        description = description.replace(name, "The company")
        description = description.replace(ticker, "[TICKER]")

    ipo_year = None
    try:
        from datetime import datetime, timezone
        # Try epoch seconds first, then milliseconds
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
            "description": description or f"A publicly traded company in the {sector} sector.",
            "ipoYear": ipo_year or 2000,
        },
    }

    return generate_puzzle(puzzle_def)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # If tickers passed as CLI args, generate those
    if len(sys.argv) > 1:
        tickers = sys.argv[1:]
        for ticker in tickers:
            try:
                puzzle = generate_from_ticker(ticker)
                for key, data in puzzle["charts"].items():
                    print(f"  {key}: {len(data)} data points")

                path = os.path.join(OUTPUT_DIR, f"{ticker.lower()}.json")
                with open(path, "w") as f:
                    json.dump(puzzle, f, indent=2)
                print(f"  Wrote {path}")
            except Exception as e:
                print(f"  ERROR generating {ticker}: {e}")
        print("\nDone!")
        return

    # Default: generate sample puzzles
    for puzzle_def in PUZZLES:
        puzzle = generate_puzzle(puzzle_def)

        for key, data in puzzle["charts"].items():
            print(f"  {key}: {len(data)} data points")

        path = os.path.join(OUTPUT_DIR, f"{puzzle_def['id']}.json")
        with open(path, "w") as f:
            json.dump(puzzle, f, indent=2)
        print(f"  Wrote {path}")

    print("\nDone!")


if __name__ == "__main__":
    main()
