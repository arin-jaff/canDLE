export const STARTING_BANKROLL = 1000;
export const WRONG_GUESS_PENALTY = 50;

export interface HintDef {
  id: string;
  label: string;
  cost: number;
  type: 'text' | 'chart' | 'price';
}

export const HINT_DEFINITIONS: HintDef[] = [
  { id: 'hqCountry', label: 'HQ COUNTRY', cost: 25, type: 'text' },
  { id: 'ipoYear', label: 'IPO YEAR', cost: 50, type: 'text' },
  { id: 'sector', label: 'SECTOR', cost: 75, type: 'text' },
  { id: '1y', label: '1Y CHART', cost: 100, type: 'chart' },
  { id: 'marketCapRange', label: 'MKT CAP', cost: 100, type: 'text' },
  { id: 'industry', label: 'INDUSTRY', cost: 125, type: 'text' },
  { id: 'high52w', label: '52W HIGH/LOW', cost: 150, type: 'text' },
  { id: '5y', label: '5Y CHART', cost: 200, type: 'chart' },
  { id: '10y', label: 'ALL-TIME CHART', cost: 250, type: 'chart' },
  { id: 'priceAxis', label: 'PRICE AXIS', cost: 250, type: 'price' },
  { id: 'description', label: 'DESCRIPTION', cost: 300, type: 'text' },
];

export function calculateScore(bankroll: number): number {
  return Math.max(0, bankroll);
}
