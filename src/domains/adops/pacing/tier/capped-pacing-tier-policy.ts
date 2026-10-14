import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a capped pacing tier score falls in. */
export function classifyCappedPacingTier(score: number): string {
  if (score < 28.5) return "critical";
  if (score < 39.1) return "ok";
  if (score < 60) return "high";
  return "low";
}

export function cappedPacingTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function cappedPacingTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedPacingTier(): number {
  const policy = retry.defaultPolicy("capped-pacing-tier");
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
