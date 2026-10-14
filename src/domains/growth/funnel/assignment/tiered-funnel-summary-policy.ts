import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredFunnelSummary(): number {
  const policy = retry.defaultPolicy("tiered-funnel-summary");
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

export function tieredFunnelSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function tieredFunnelSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
