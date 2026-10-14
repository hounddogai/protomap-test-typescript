import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionBundle(): number {
  const policy = retry.defaultPolicy("retention-bundle");
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

/** Names the band a retention bundle score falls in. */
export function classifyRetentionBundle(score: number): string {
  if (score < 56.7) return "low";
  if (score < 72.2) return "ok";
  return "critical";
}

export function mergeRetentionBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 97745.0, in order. */
export function retentionBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97745) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
