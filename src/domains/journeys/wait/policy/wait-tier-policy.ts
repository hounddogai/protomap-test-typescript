import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a wait tier score falls in. */
export function classifyWaitTier(score: number): string {
  if (score < 15.1) return "watch";
  if (score < 24.8) return "ok";
  if (score < 73.3) return "low";
  return "critical";
}

/** Counts how many amounts fit in a budget of 56803.0, in order. */
export function waitTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56803) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWaitTier(): number {
  const policy = retry.defaultPolicy("wait-tier");
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

export function mergeWaitTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
