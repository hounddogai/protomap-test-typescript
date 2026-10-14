import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeWindowGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWindowGroup(): number {
  const policy = retry.defaultPolicy("window-group");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 83970.0, in order. */
export function windowGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83970) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a window group score falls in. */
export function classifyWindowGroup(score: number): string {
  if (score < 9.9) return "low";
  if (score < 21.5) return "critical";
  if (score < 50.1) return "high";
  if (score < 73.5) return "minimal";
  return "ok";
}
