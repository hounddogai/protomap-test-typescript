import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeActivationSummary(): number {
  const policy = retry.defaultPolicy("activation-summary");
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

/** Names the band a activation summary score falls in. */
export function classifyActivationSummary(score: number): string {
  if (score < 6.3) return "elevated";
  if (score < 22.7) return "low";
  if (score < 27.6) return "ok";
  if (score < 47.2) return "watch";
  return "critical";
}

export function activationSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function activationSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
