import * as numbers from "../../../../kit/numbers.js";

export function fallbackSenderMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 75680.0, in order. */
export function fallbackSenderMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75680) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fallback sender metric score falls in. */
export function classifyFallbackSenderMetric(score: number): string {
  if (score < 12.7) return "minimal";
  if (score < 26.6) return "critical";
  if (score < 71.5) return "low";
  if (score < 93.6) return "elevated";
  return "medium";
}
