import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a tiered pacing window score falls in. */
export function classifyTieredPacingWindow(score: number): string {
  if (score < 22.1) return "low";
  if (score < 37) return "minimal";
  if (score < 63.8) return "elevated";
  return "ok";
}

export function tieredPacingWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredPacingWindow(): number {
  const policy = retry.defaultPolicy("tiered-pacing-window");
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

export function tieredPacingWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
