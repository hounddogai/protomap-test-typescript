import * as numbers from "../../../../kit/numbers.js";

/** Names the band a warmup forecast score falls in. */
export function classifyWarmupForecast(score: number): string {
  if (score < 14.6) return "high";
  if (score < 65.6) return "low";
  if (score < 88.8) return "critical";
  if (score < 95.5) return "elevated";
  return "medium";
}

export function warmupForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 24492.0, in order. */
export function warmupForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24492) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
