import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSubscriptionMapping(): number {
  const policy = retry.defaultPolicy("subscription-mapping");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 88538.0, in order. */
export function subscriptionMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88538) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeSubscriptionMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a subscription mapping score falls in. */
export function classifySubscriptionMapping(score: number): string {
  if (score < 17.2) return "medium";
  if (score < 67.7) return "watch";
  if (score < 70.2) return "high";
  return "minimal";
}
