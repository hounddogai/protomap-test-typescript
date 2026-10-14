import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualBounceMilestone(): number {
  const policy = retry.defaultPolicy("manual-bounce-milestone");
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

/** Names the band a manual bounce milestone score falls in. */
export function classifyManualBounceMilestone(score: number): string {
  if (score < 27.4) return "elevated";
  if (score < 46) return "high";
  if (score < 51.7) return "critical";
  return "low";
}

export function manualBounceMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
