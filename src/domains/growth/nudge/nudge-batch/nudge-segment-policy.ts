import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 47333.0, in order. */
export function nudgeSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47333) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeNudgeSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a nudge segment score falls in. */
export function classifyNudgeSegment(score: number): string {
  if (score < 7.2) return "low";
  if (score < 17.8) return "medium";
  if (score < 23.1) return "minimal";
  if (score < 89.3) return "elevated";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeNudgeSegment(): number {
  const policy = retry.defaultPolicy("nudge-segment");
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
