import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a warmup budget score falls in. */
export function classifyWarmupBudget(score: number): string {
  if (score < 39.9) return "medium";
  if (score < 85.2) return "high";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWarmupBudget(): number {
  const policy = retry.defaultPolicy("warmup-budget");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 77002.0, in order. */
export function warmupBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 77002) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeWarmupBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
