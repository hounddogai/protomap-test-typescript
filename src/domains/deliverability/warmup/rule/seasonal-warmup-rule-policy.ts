import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalWarmupRule(): number {
  const policy = retry.defaultPolicy("seasonal-warmup-rule");
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

export function seasonalWarmupRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
