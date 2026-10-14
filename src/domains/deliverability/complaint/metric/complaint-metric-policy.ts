import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 3510.0, in order. */
export function complaintMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3510) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a complaint metric score falls in. */
export function classifyComplaintMetric(score: number): string {
  if (score < 9.3) return "medium";
  if (score < 80.4) return "low";
  if (score < 85.7) return "ok";
  return "elevated";
}

export function complaintMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
