#!/usr/bin/env python3
"""Daily puzzle generator for canDLE GitHub Actions automation.

Picks a random S&P 500 ticker (no recent repeats), generates its puzzle
(chart data from yfinance + Gemini description + difficulty rating),
appends it to the schedule, and saves everything. GitHub Actions commits
and pushes the changes, triggering a Cloudflare Pages redeploy.
"""

import json
import os
import random
import sys
import time
from datetime import datetime, timedelta

# Paths relative to repo root
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SP500_PATH = os.path.join(REPO_ROOT, "scripts", "sp500_tickers.json")
SCHEDULE_PATH = os.path.join(REPO_ROOT, "public", "schedule.json")
PUZZLES_DIR = os.path.join(REPO_ROOT, "public", "puzzles")

# Import the existing generation functions
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))
from generate_puzzles import generate_from_ticker, SafeJSONEncoder

# Don't repeat any ticker used in the last 90 days
LOOKBACK_DAYS = 90
# Maintain a ~30-day lookahead buffer
BUFFER_DAYS = 30
# Max puzzles to generate per run (avoid long CI jobs / rate limits)
MAX_PER_RUN = 3


def load_json(path):
    with open(path) as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, cls=SafeJSONEncoder)


def get_recently_used_tickers(schedule, lookback=LOOKBACK_DAYS):
    """Return set of tickers used in the last `lookback` days of the schedule."""
    cutoff = datetime.now() - timedelta(days=lookback)
    used = set()
    for date_str, ticker in schedule.items():
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d")
            if d >= cutoff:
                used.add(ticker.upper())
        except ValueError:
            continue
    return used


def get_next_date(schedule):
    """Find the day after the last scheduled date."""
    if not schedule:
        return datetime.now().strftime("%Y-%m-%d")
    last_date = max(schedule.keys())
    d = datetime.strptime(last_date, "%Y-%m-%d") + timedelta(days=1)
    return d.strftime("%Y-%m-%d")


def pick_ticker(pool, recently_used):
    """Pick a random ticker from the pool that hasn't been used recently."""
    available = [t for t in pool if t["ticker"].upper() not in recently_used]
    if not available:
        print("WARNING: All tickers used recently, resetting pool")
        available = pool
    return random.choice(available)


def prune_old_dates(schedule, keep_days_back=7):
    """Remove schedule entries more than `keep_days_back` days in the past."""
    cutoff = (datetime.now() - timedelta(days=keep_days_back)).strftime("%Y-%m-%d")
    return {k: v for k, v in schedule.items() if k >= cutoff}


def main():
    os.makedirs(PUZZLES_DIR, exist_ok=True)

    # 1. Load data
    pool = load_json(SP500_PATH)
    schedule = load_json(SCHEDULE_PATH)

    # 2. Determine how many days need filling to maintain buffer
    today = datetime.now().strftime("%Y-%m-%d")
    target_end = (datetime.now() + timedelta(days=BUFFER_DAYS)).strftime("%Y-%m-%d")
    last_scheduled = max(schedule.keys()) if schedule else today

    days_to_add = max(1, (datetime.strptime(target_end, "%Y-%m-%d") -
                          datetime.strptime(last_scheduled, "%Y-%m-%d")).days)
    days_to_add = min(days_to_add, MAX_PER_RUN)

    print(f"Today: {today}")
    print(f"Last scheduled: {last_scheduled}")
    print(f"Target end: {target_end}")
    print(f"Days to add: {days_to_add}")

    recently_used = get_recently_used_tickers(schedule)
    errors = []
    added = 0

    for i in range(days_to_add):
        next_date = get_next_date(schedule)
        selected = pick_ticker(pool, recently_used)
        ticker = selected["ticker"]

        print(f"\n--- [{i+1}/{days_to_add}] Generating puzzle for {next_date}: {ticker} ---")

        try:
            puzzle = generate_from_ticker(ticker)

            # Validate: must have chart data
            if not puzzle.get("charts", {}).get("1m"):
                raise ValueError(f"No 1m chart data for {ticker}")

            # Save puzzle JSON
            puzzle_path = os.path.join(PUZZLES_DIR, f"{ticker.lower()}.json")
            save_json(puzzle_path, puzzle)
            print(f"Saved {puzzle_path}")

            # Update schedule
            schedule[next_date] = ticker
            recently_used.add(ticker.upper())
            added += 1

        except Exception as e:
            print(f"ERROR generating {ticker}: {e}")
            errors.append(f"{ticker}: {e}")

            # Try one fallback ticker
            try:
                fallback = pick_ticker(pool, recently_used | {ticker.upper()})
                ticker = fallback["ticker"]
                print(f"Retrying with fallback: {ticker}")
                puzzle = generate_from_ticker(ticker)
                if not puzzle.get("charts", {}).get("1m"):
                    raise ValueError(f"No 1m chart data for {ticker}")
                puzzle_path = os.path.join(PUZZLES_DIR, f"{ticker.lower()}.json")
                save_json(puzzle_path, puzzle)
                schedule[next_date] = ticker
                recently_used.add(ticker.upper())
                added += 1
            except Exception as e2:
                print(f"FALLBACK ALSO FAILED for {ticker}: {e2}")
                errors.append(f"fallback {ticker}: {e2}")
                continue

        # Brief pause between generations to avoid rate limits
        if i < days_to_add - 1:
            time.sleep(2)

    # 3. Prune old dates (keep 7 days of history)
    schedule = prune_old_dates(schedule)

    # 4. Sort schedule by date
    schedule = dict(sorted(schedule.items()))

    # 5. Save updated schedule
    save_json(SCHEDULE_PATH, schedule)
    print(f"\nSchedule updated: {len(schedule)} entries, {added} new puzzles added")

    if errors:
        print(f"\nWARNINGS: {len(errors)} errors occurred:")
        for e in errors:
            print(f"  - {e}")

    if added == 0:
        print("ERROR: No puzzles were generated!")
        sys.exit(1)

    print("\nDone!")


if __name__ == "__main__":
    main()
