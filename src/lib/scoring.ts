export const STARTING_BANKROLL = 1000;
export const WRONG_GUESS_PENALTY = 150;

export interface HintDef {
  id: string;
  label: string;
  cost: number;
  type: 'text' | 'chart' | 'price';
}

export const HINT_DEFINITIONS: HintDef[] = [
  { id: 'sector', label: 'SECTOR', cost: 50, type: 'text' },
  { id: 'marketCapRange', label: 'MKT CAP', cost: 50, type: 'text' },
  { id: 'hqCountry', label: 'HQ COUNTRY', cost: 75, type: 'text' },
  { id: '1m', label: '1M CHART', cost: 75, type: 'chart' },
  { id: '5y', label: '5Y CHART', cost: 100, type: 'chart' },
  { id: 'description', label: 'DESCRIPTION', cost: 100, type: 'text' },
  { id: 'high52w', label: '52W HIGH/LOW', cost: 100, type: 'text' },
  { id: '10y', label: '10Y CHART', cost: 125, type: 'chart' },
  { id: 'industry', label: 'INDUSTRY', cost: 125, type: 'text' },
  { id: 'ipoYear', label: 'IPO YEAR', cost: 150, type: 'text' },
  { id: 'priceAxis', label: 'PRICE AXIS', cost: 150, type: 'price' },
];

export function calculateScore(bankroll: number): number {
  return Math.max(0, bankroll);
}
