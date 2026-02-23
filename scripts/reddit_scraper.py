#!/usr/bin/env python3
"""
Reddit Ticker Scraper
Scrapes popular stock subreddits for ticker mentions and outputs a frequency report.
Uses Reddit's public JSON API (no API key needed).
"""

import json
import os
import re
import time
from collections import Counter
from datetime import datetime

import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

SUBREDDITS = ["wallstreetbets", "stocks", "investing", "stockmarket", "options"]

# Common English words that happen to be 1-5 uppercase letters matching ticker format
FALSE_POSITIVES = {
    "A", "I", "AM", "AN", "AS", "AT", "BE", "BY", "DO", "GO", "IF", "IN",
    "IS", "IT", "ME", "MY", "NO", "OF", "OK", "ON", "OR", "SO", "TO", "UP",
    "US", "WE", "ALL", "AND", "ANY", "ARE", "BAD", "BIG", "BUT", "BUY",
    "CAN", "DAY", "DID", "FOR", "GET", "GOT", "HAS", "HAD", "HER", "HIM",
    "HIS", "HOW", "ITS", "LET", "LOT", "MAY", "NEW", "NOT", "NOW", "OLD",
    "ONE", "OUR", "OUT", "OWN", "PUT", "RAN", "RUN", "SAY", "SHE", "THE",
    "TOO", "TOP", "TRY", "TWO", "USE", "WAR", "WAS", "WAY", "WHO", "WHY",
    "WIN", "WON", "YES", "YET", "YOU", "ALSO", "BACK", "BEEN", "BEST",
    "BOTH", "CALL", "CAME", "COME", "DOES", "DONE", "DOWN", "EACH", "EVEN",
    "EVER", "FACT", "FEEL", "FIND", "FIRE", "FROM", "FUND", "GAVE", "GOES",
    "GONE", "GOOD", "HALF", "HANG", "HAVE", "HEAD", "HEAR", "HELP", "HERE",
    "HIGH", "HOLD", "HOME", "HOPE", "HUGE", "IDEA", "INTO", "JUST", "KEEP",
    "KIND", "KNEW", "KNOW", "LAST", "LEFT", "LESS", "LIFE", "LIKE", "LINE",
    "LIST", "LONG", "LOOK", "LOSE", "LOST", "LOTS", "MADE", "MAIN", "MAKE",
    "MANY", "MIND", "MORE", "MOST", "MUCH", "MUST", "NAME", "NEAR", "NEED",
    "NEXT", "NICE", "NONE", "ONLY", "OPEN", "OVER", "PAID", "PART", "PAST",
    "PLAY", "POST", "READ", "REAL", "REST", "RIDE", "RISK", "SAID", "SAME",
    "SAVE", "SEEN", "SELL", "SHOW", "SIDE", "SOME", "SOON", "STOP", "SURE",
    "TAKE", "TALK", "TELL", "THAN", "THAT", "THEM", "THEN", "THEY", "THIS",
    "TIME", "TOLD", "TOOK", "TURN", "VERY", "WAIT", "WANT", "WEEK", "WELL",
    "WENT", "WERE", "WHAT", "WHEN", "WILL", "WITH", "WORD", "WORK", "YEAR",
    "YOUR", "ZERO", "ABOUT", "AFTER", "AGAIN", "BEING", "BELOW", "COULD",
    "EVERY", "FIRST", "GIVEN", "GOING", "GREAT", "GREEN", "GROUP", "HAPPY",
    "HEARD", "GONNA", "IMHO", "LMAO", "YOLO", "FOMO", "HODL", "MOON",
    "PUMP", "DUMP", "BEAR", "BULL", "GAIN", "LOSS", "CASH", "DEBT", "BOND",
    "RATE", "EDIT", "LINK", "MOVE", "PLAN", "PUSH", "PULL", "ROLL", "RULE",
    "SAFE", "SIGN", "SORT", "STEP", "TEST", "TIPS", "UNIT", "VIEW", "VOTE",
    "BANG", "BOOM", "BURN", "BUSY", "CALM", "CARE", "COOL", "CORE", "COST",
    "CREW", "DARK", "DATA", "DEAL", "DEEP", "DROP", "DRUG", "DUMB", "DUTY",
    "EARN", "EASE", "EAST", "EDGE", "ELSE", "FACE", "FAIL", "FAIR", "FALL",
    "FAST", "FEAR", "FILL", "FINE", "FLAT", "FOOD", "FOOL", "FORM", "FREE",
    "FULL", "GAME", "GIFT", "GIRL", "GLAD", "GOLD", "GROW", "GUYS", "HAND",
    "HARD", "HATE", "HEAT", "HELD", "HIDE", "HIRE", "HITS", "HOLE", "HOUR",
    "HURT", "IRON", "ITEM", "JACK", "JOBS", "JOIN", "JUMP", "JUNE", "JURY",
    "KEEN", "KICK", "KILL", "KING", "LACK", "LAND", "LATE", "LEAD", "LEAN",
    "LIVE", "LOAN", "LOCK", "LOGO", "LUCK", "MARK", "MASS", "MATH", "MEAL",
    "MEET", "MINE", "MISS", "MODE", "MOOD", "NOTE", "ODDS", "OKAY", "ONCE",
    "PACK", "PAGE", "PAIR", "PASS", "PATH", "PEAK", "PICK", "PILE", "PIPE",
    "POOR", "PURE", "RACE", "RAGE", "RAIN", "RARE", "RISE", "ROAD", "ROCK",
    "ROOF", "ROOM", "ROOT", "ROPE", "ROSE", "RUSH", "SALE", "SALT", "SAND",
    "SEAT", "SELF", "SEND", "SENT", "SHIP", "SHOP", "SHOT", "SHUT", "SICK",
    "SIZE", "SKIN", "SLOW", "SNAP", "SOLD", "SOLE", "SONG", "SPOT", "STAR",
    "STAY", "STEM", "SUCK", "SUIT", "SWAP", "TAIL", "TANK", "TAPE", "TASK",
    "TEAM", "TECH", "TERM", "TEXT", "THIN", "THUS", "TICK", "TIED", "TIER",
    "TILL", "TINY", "TIRE", "TONE", "TOOL", "TOWN", "TRAP", "TREE", "TRIM",
    "TRIP", "TRUE", "TUBE", "TYPE", "UGLY", "UPON", "USED", "USER", "VAST",
    "VICE", "WAGE", "WAKE", "WALK", "WALL", "WARN", "WASH", "WAVE", "WEAK",
    "WEAR", "WIDE", "WILD", "WING", "WIRE", "WISE", "WISH", "WOOD", "WORE",
    "WRAP", "YARD", "YEAH",
    # Reddit/finance jargon
    "DD", "TA", "FA", "PE", "EPS", "CEO", "CFO", "COO", "CTO", "IPO",
    "ETF", "SEC", "FED", "GDP", "CPI", "ATH", "ATL", "OTM", "ITM", "IV",
    "DCA", "ROI", "RSI", "EMA", "SMA", "LOL", "OMG", "WTF", "IMO", "TBH",
    "FYI", "PSA", "TIL", "RIP", "OG", "OP",
}

HEADERS = {
    "User-Agent": "canDLE-scraper/1.0 (stock guessing game research)",
}


def load_valid_tickers():
    """Load S&P 500 tickers as the set of valid tickers to match against."""
    path = os.path.join(SCRIPT_DIR, "sp500_tickers.json")
    with open(path) as f:
        data = json.load(f)
    return {entry["ticker"].upper() for entry in data}


def extract_tickers(text, valid_tickers):
    """Extract ticker symbols from text. Matches $TICKER or standalone uppercase words."""
    # Match $TICKER or standalone uppercase 1-5 letter words
    matches = re.findall(r'\$([A-Z]{1,5})\b', text)
    matches += re.findall(r'\b([A-Z]{1,5})\b', text)
    return [t for t in matches if t in valid_tickers and t not in FALSE_POSITIVES]


def scrape_subreddit(subreddit, valid_tickers, limit=100):
    """Scrape hot posts from a subreddit and extract ticker mentions."""
    tickers = []
    after = None
    fetched = 0

    while fetched < limit:
        url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit=25&raw_json=1"
        if after:
            url += f"&after={after}"

        try:
            res = requests.get(url, headers=HEADERS, timeout=15)
            if res.status_code == 429:
                print(f"  Rate limited on r/{subreddit}, waiting 10s...")
                time.sleep(10)
                continue
            if res.status_code != 200:
                print(f"  Failed r/{subreddit}: HTTP {res.status_code}")
                break

            data = res.json()
            posts = data.get("data", {}).get("children", [])
            if not posts:
                break

            for post in posts:
                p = post.get("data", {})
                title = p.get("title", "")
                selftext = p.get("selftext", "")
                tickers.extend(extract_tickers(title + " " + selftext, valid_tickers))

            after = data.get("data", {}).get("after")
            fetched += len(posts)

            if not after:
                break

            # Be respectful of rate limits
            time.sleep(2)

        except requests.RequestException as e:
            print(f"  Error scraping r/{subreddit}: {e}")
            break

    return tickers


def main():
    valid_tickers = load_valid_tickers()
    print(f"Loaded {len(valid_tickers)} valid S&P 500 tickers")

    all_tickers = []

    for sub in SUBREDDITS:
        print(f"Scraping r/{sub}...")
        tickers = scrape_subreddit(sub, valid_tickers, limit=100)
        print(f"  Found {len(tickers)} ticker mentions")
        all_tickers.extend(tickers)
        time.sleep(3)  # pause between subreddits

    counts = Counter(all_tickers)
    sorted_tickers = counts.most_common()

    # Write output
    output_path = os.path.join(SCRIPT_DIR, "reddit_tickers.txt")
    with open(output_path, "w") as f:
        f.write("Reddit Ticker Frequency Report\n")
        f.write(f"Scraped: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"Subreddits: {', '.join(SUBREDDITS)}\n")
        f.write(f"Total mentions: {len(all_tickers)}\n")
        f.write(f"Unique tickers: {len(sorted_tickers)}\n")
        f.write("---\n")
        for ticker, count in sorted_tickers:
            f.write(f"{ticker:<8}{count}\n")

    print(f"\nDone! {len(sorted_tickers)} unique tickers found across {len(all_tickers)} mentions")
    print(f"Report saved to {output_path}")


if __name__ == "__main__":
    main()
