import * as numbers from "../../../../kit/numbers.js";

/** Names the band a subscription policy score falls in. */
export function classifySubscriptionPolicy(score: number): string {
  if (score < 54.8) return "high";
  if (score < 73.5) return "minimal";
  if (score < 88) return "watch";
  return "low";
}

export function subscriptionPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function subscriptionPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 43239.0, in order. */
export function subscriptionPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43239) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
