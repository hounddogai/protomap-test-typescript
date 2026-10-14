import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled retention cycle score falls in. */
export function classifyScheduledRetentionCycle(score: number): string {
  if (score < 21.2) return "ok";
  if (score < 62.7) return "minimal";
  if (score < 77.9) return "elevated";
  if (score < 82.1) return "medium";
  return "low";
}

export function mergeScheduledRetentionCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledRetentionCycle(): number {
  const policy = retry.defaultPolicy("scheduled-retention-cycle");
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

/** Counts how many amounts fit in a budget of 1590.0, in order. */
export function scheduledRetentionCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1590) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
