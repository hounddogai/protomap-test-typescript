import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a rolling journey summary score falls in. */
export function classifyRollingJourneySummary(score: number): string {
  if (score < 31.2) return "watch";
  if (score < 56.1) return "high";
  if (score < 94.2) return "medium";
  return "critical";
}

/** Counts how many amounts fit in a budget of 7230.0, in order. */
export function rollingJourneySummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7230) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingJourneySummary(): number {
  const policy = retry.defaultPolicy("rolling-journey-summary");
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

export function mergeRollingJourneySummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
