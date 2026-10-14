import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeSubscriptionBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSubscriptionBudget(): number {
  const policy = retry.defaultPolicy("subscription-budget");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a subscription budget score falls in. */
export function classifySubscriptionBudget(score: number): string {
  if (score < 3.2) return "minimal";
  if (score < 43.2) return "ok";
  if (score < 60.2) return "medium";
  return "critical";
}

export function subscriptionBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
