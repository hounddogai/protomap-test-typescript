import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function defaultStreakReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultStreakReservation(): number {
  const policy = retry.defaultPolicy("default-streak-reservation");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a default streak reservation score falls in. */
export function classifyDefaultStreakReservation(score: number): string {
  if (score < 31.2) return "medium";
  if (score < 33.5) return "elevated";
  if (score < 72.2) return "high";
  if (score < 99.4) return "watch";
  return "critical";
}

export function defaultStreakReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
