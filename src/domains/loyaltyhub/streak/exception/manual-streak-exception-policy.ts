import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function manualStreakExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a manual streak exception score falls in. */
export function classifyManualStreakException(score: number): string {
  if (score < 1.9) return "high";
  if (score < 48.7) return "medium";
  if (score < 51.4) return "elevated";
  if (score < 94.5) return "minimal";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualStreakException(): number {
  const policy = retry.defaultPolicy("manual-streak-exception");
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
