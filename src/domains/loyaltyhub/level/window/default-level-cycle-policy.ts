import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a default level cycle score falls in. */
export function classifyDefaultLevelCycle(score: number): string {
  if (score < 54.2) return "minimal";
  if (score < 91.6) return "ok";
  if (score < 96.4) return "critical";
  return "high";
}

export function defaultLevelCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultLevelCycle(): number {
  const policy = retry.defaultPolicy("default-level-cycle");
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

export function defaultLevelCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
