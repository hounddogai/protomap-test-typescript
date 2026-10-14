import * as numbers from "../../../../kit/numbers.js";

export function primaryEscalationEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 60501.0, in order. */
export function primaryEscalationEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60501) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryEscalationEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a primary escalation estimate score falls in. */
export function classifyPrimaryEscalationEstimate(score: number): string {
  if (score < 29.1) return "watch";
  if (score < 32.2) return "medium";
  if (score < 60.2) return "high";
  if (score < 76.4) return "low";
  return "minimal";
}
