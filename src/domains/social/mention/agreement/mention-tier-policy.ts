import * as numbers from "../../../../kit/numbers.js";

/** Names the band a mention tier score falls in. */
export function classifyMentionTier(score: number): string {
  if (score < 40.2) return "high";
  if (score < 52.5) return "ok";
  if (score < 70.4) return "watch";
  if (score < 88.7) return "low";
  return "elevated";
}

export function mentionTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function mentionTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 31965.0, in order. */
export function mentionTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31965) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
