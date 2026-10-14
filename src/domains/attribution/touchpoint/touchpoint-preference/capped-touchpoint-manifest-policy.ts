import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 11446.0, in order. */
export function cappedTouchpointManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11446) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedTouchpointManifest(): number {
  const policy = retry.defaultPolicy("capped-touchpoint-manifest");
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

export function cappedTouchpointManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a capped touchpoint manifest score falls in. */
export function classifyCappedTouchpointManifest(score: number): string {
  if (score < 13.6) return "elevated";
  if (score < 29.7) return "minimal";
  if (score < 81.1) return "critical";
  if (score < 81.8) return "medium";
  return "low";
}
