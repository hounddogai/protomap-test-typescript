import * as numbers from "../../../../kit/numbers.js";

export function globalDeflectionBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a global deflection baseline score falls in. */
export function classifyGlobalDeflectionBaseline(score: number): string {
  if (score < 28) return "watch";
  if (score < 43.8) return "high";
  if (score < 44) return "elevated";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 31760.0, in order. */
export function globalDeflectionBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31760) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
