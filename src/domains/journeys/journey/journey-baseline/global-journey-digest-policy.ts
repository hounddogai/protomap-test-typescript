import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function globalJourneyDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalJourneyDigest(): number {
  const policy = retry.defaultPolicy("global-journey-digest");
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

/** Names the band a global journey digest score falls in. */
export function classifyGlobalJourneyDigest(score: number): string {
  if (score < 19.1) return "medium";
  if (score < 45.6) return "high";
  if (score < 49.6) return "watch";
  if (score < 92.5) return "minimal";
  return "ok";
}

/** Counts how many amounts fit in a budget of 39172.0, in order. */
export function globalJourneyDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39172) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
