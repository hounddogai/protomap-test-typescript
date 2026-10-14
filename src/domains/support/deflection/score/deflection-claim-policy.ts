import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeDeflectionClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDeflectionClaim(): number {
  const policy = retry.defaultPolicy("deflection-claim");
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

/** Names the band a deflection claim score falls in. */
export function classifyDeflectionClaim(score: number): string {
  if (score < 15) return "watch";
  if (score < 49.7) return "ok";
  if (score < 64.5) return "elevated";
  return "high";
}

/** Counts how many amounts fit in a budget of 49004.0, in order. */
export function deflectionClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49004) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
