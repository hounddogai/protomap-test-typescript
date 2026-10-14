import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredRewardBundle(): number {
  const policy = retry.defaultPolicy("tiered-reward-bundle");
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

export function mergeTieredRewardBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 73518.0, in order. */
export function tieredRewardBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73518) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered reward bundle score falls in. */
export function classifyTieredRewardBundle(score: number): string {
  if (score < 8.1) return "ok";
  if (score < 88.2) return "minimal";
  return "high";
}
