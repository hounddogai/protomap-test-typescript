import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 38923.0, in order. */
export function flightDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38923) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a flight digest score falls in. */
export function classifyFlightDigest(score: number): string {
  if (score < 56.1) return "minimal";
  if (score < 89.2) return "critical";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFlightDigest(): number {
  const policy = retry.defaultPolicy("flight-digest");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergeFlightDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
