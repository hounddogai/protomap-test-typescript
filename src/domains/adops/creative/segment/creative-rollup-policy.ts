import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeCreativeRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreativeRollup(): number {
  const policy = retry.defaultPolicy("creative-rollup");
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

/** Names the band a creative rollup score falls in. */
export function classifyCreativeRollup(score: number): string {
  if (score < 58.3) return "watch";
  if (score < 59) return "high";
  if (score < 85.6) return "minimal";
  if (score < 92.6) return "critical";
  return "medium";
}

/** Counts how many amounts fit in a budget of 6547.0, in order. */
export function creativeRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6547) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
