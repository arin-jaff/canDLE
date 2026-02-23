/**
 * Gemini API helper for generating descriptions, fun facts, and difficulty ratings.
 * Runs in Cloudflare Workers runtime (no Python needed).
 */

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-12b-it:generateContent';

interface GeminiResult {
  description: string;
  funFact1: string;
  funFact2: string;
}

/** Generate description + 2 fun facts via Gemini */
export async function generateDescription(
  apiKey: string,
  ticker: string,
  name: string,
  sector: string,
  industry: string,
): Promise<GeminiResult | null> {
  const prompt = `You are generating hints for a stock guessing game called canDLE. Players see an anonymized stock chart and buy hints to guess the company ticker.

Generate the following for ${name} (ticker: ${ticker}):

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

No quotes, no extra explanation.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    });

    if (!res.ok) return null;

    const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
    const text = data.candidates[0].content.parts[0].text.trim();

    let description = '';
    let funFact1 = '';
    let funFact2 = '';

    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.toUpperCase().startsWith('DESCRIPTION:')) {
        description = trimmed.slice('DESCRIPTION:'.length).trim();
      } else if (trimmed.toUpperCase().startsWith('FUN FACT 1:')) {
        funFact1 = trimmed.slice('FUN FACT 1:'.length).trim();
      } else if (trimmed.toUpperCase().startsWith('FUN FACT 2:')) {
        funFact2 = trimmed.slice('FUN FACT 2:'.length).trim();
      }
    }

    if (!description) description = text;

    return {
      description,
      funFact1: funFact1 || 'This company has an interesting history in its industry.',
      funFact2: funFact2 || 'The company has made significant contributions to its sector.',
    };
  } catch {
    return null;
  }
}

/** Generate difficulty rating 1-5 via Gemini */
export async function generateDifficulty(
  apiKey: string,
  ticker: string,
  name: string,
  sector: string,
  industry: string,
): Promise<number> {
  const prompt = `Rate how difficult it would be for an average retail investor to identify this stock in a guessing game, on a scale of 1 to 5:

1 = Very Easy (household name, in the news constantly — e.g., Apple, Tesla, Amazon)
2 = Easy (well-known large cap, most investors would recognize — e.g., Nike, Disney, Coca-Cola)
3 = Medium (known to active investors but not general public — e.g., Broadcom, Thermo Fisher)
4 = Hard (niche or B2B company, mainly known to sector specialists — e.g., Verisign, Rollins)
5 = Very Hard (obscure S&P 500 member, most people have never heard of it — e.g., NRG Energy, Paycom)

Stock: ${name} (ticker: ${ticker})
Sector: ${sector}
Industry: ${industry}

Reply with ONLY a single digit: 1, 2, 3, 4, or 5. No explanation.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 10 },
      }),
    });

    if (!res.ok) return 3;

    const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
    const text = data.candidates[0].content.parts[0].text.trim();
    const digit = parseInt(text[0]);
    if (digit >= 1 && digit <= 5) return digit;
  } catch { /* ignore */ }

  return 3;
}
