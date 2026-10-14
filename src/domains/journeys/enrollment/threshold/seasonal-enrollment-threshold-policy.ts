import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a seasonal enrollment threshold score falls in. */
export function classifySeasonalEnrollmentThreshold(score: number): string {
  if (score < 6.3) return "low";
  if (score < 52.3) return "high";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalEnrollmentThreshold(): number {
  const policy = retry.defaultPolicy("seasonal-enrollment-threshold");
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

export function mergeSeasonalEnrollmentThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 11986.0, in order. */
export function seasonalEnrollmentThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11986) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
