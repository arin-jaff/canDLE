#!/usr/bin/env python3
"""Regenerate description (and difficulty) for an existing puzzle via Gemini.

Usage:
  python3 scripts/regen_description.py AAPL
"""

import json
import os
import sys

# Import shared Gemini helpers from generate_puzzles
sys.path.insert(0, os.path.dirname(__file__))
from generate_puzzles import generate_description_gemini, generate_difficulty_gemini, SafeJSONEncoder

PUZZLES_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "puzzles")


def regen(ticker: str):
    ticker_upper = ticker.upper()
    ticker_lower = ticker.lower()
    path = os.path.join(PUZZLES_DIR, f"{ticker_lower}.json")

    if not os.path.exists(path):
        print(f"ERROR: Puzzle file not found: {path}")
        sys.exit(1)

    with open(path, "r") as f:
        puzzle = json.load(f)

    hints = puzzle.get("hints", {})
    name = puzzle.get("answer", {}).get("name", ticker_upper)
    sector = hints.get("sector", "Unknown")
    industry = hints.get("industry", "Unknown")
    country = hints.get("hqCountry", "Unknown")
    ipo_year = hints.get("ipoYear")

    print(f"Regenerating description for {ticker_upper} ({name})...")

    gemini_result = generate_description_gemini(ticker_upper, name, sector, industry, country, ipo_year)
    if gemini_result:
        puzzle["hints"]["description"] = gemini_result["description"]
        puzzle["hints"]["funFact1"] = gemini_result["funFact1"]
        puzzle["hints"]["funFact2"] = gemini_result["funFact2"]
        print(f"  New description: {gemini_result['description'][:80]}...")
        print(f"  Fun fact 1: {gemini_result['funFact1'][:60]}...")
        print(f"  Fun fact 2: {gemini_result['funFact2'][:60]}...")
    else:
        print("  Description generation failed, keeping existing.")

    new_diff = generate_difficulty_gemini(ticker_upper, name, sector, industry)
    puzzle["difficulty"] = new_diff
    print(f"  Difficulty: {new_diff}/5")

    with open(path, "w") as f:
        json.dump(puzzle, f, indent=2, cls=SafeJSONEncoder)
    print(f"  Wrote {path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/regen_description.py TICKER")
        sys.exit(1)
    regen(sys.argv[1])
