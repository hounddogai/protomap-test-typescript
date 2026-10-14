import * as numbers from "../../../../kit/numbers.js";

/** Puts a frequency rollup code in its canonical FR- form. */
export function normalizeFrequencyRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FR-")) return clean;
  return `FR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 29685.0, in order. */
export function frequencyRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29685) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a frequency rollup score falls in. */
export function classifyFrequencyRollup(score: number): string {
  if (score < 50.3) return "medium";
  if (score < 59.2) return "critical";
  return "high";
}

export function frequencyRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
