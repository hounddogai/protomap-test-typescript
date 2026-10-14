import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a manual badge adjustment score falls in. */
export function classifyManualBadgeAdjustment(score: number): string {
  if (score < 51.1) return "minimal";
  if (score < 56.3) return "watch";
  return "ok";
}

export function manualBadgeAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualBadgeAdjustment(): number {
  const policy = retry.defaultPolicy("manual-badge-adjustment");
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
