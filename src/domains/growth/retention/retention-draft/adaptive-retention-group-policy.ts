import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a adaptive retention group score falls in. */
export function classifyAdaptiveRetentionGroup(score: number): string {
  if (score < 28.8) return "medium";
  if (score < 65.8) return "watch";
  if (score < 76.9) return "high";
  return "ok";
}

/** Counts how many amounts fit in a budget of 68103.0, in order. */
export function adaptiveRetentionGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68103) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeAdaptiveRetentionGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveRetentionGroup(): number {
  const policy = retry.defaultPolicy("adaptive-retention-group");
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
