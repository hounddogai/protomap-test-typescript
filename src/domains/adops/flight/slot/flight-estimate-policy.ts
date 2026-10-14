import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFlightEstimate(): number {
  const policy = retry.defaultPolicy("flight-estimate");
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

export function mergeFlightEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 88238.0, in order. */
export function flightEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88238) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a flight estimate score falls in. */
export function classifyFlightEstimate(score: number): string {
  if (score < 27.2) return "low";
  if (score < 33) return "elevated";
  if (score < 49.9) return "minimal";
  return "critical";
}
