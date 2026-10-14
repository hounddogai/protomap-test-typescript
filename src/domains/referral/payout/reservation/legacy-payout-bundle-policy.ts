import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 98798.0, in order. */
export function legacyPayoutBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98798) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a legacy payout bundle score falls in. */
export function classifyLegacyPayoutBundle(score: number): string {
  if (score < 40.1) return "high";
  if (score < 88.2) return "low";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyPayoutBundle(): number {
  const policy = retry.defaultPolicy("legacy-payout-bundle");
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

export function mergeLegacyPayoutBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
