import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function fallbackCreditExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.68;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackCreditException(): number {
  const policy = retry.defaultPolicy("fallback-credit-exception");
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

/** Names the band a fallback credit exception score falls in. */
export function classifyFallbackCreditException(score: number): string {
  if (score < 35) return "elevated";
  if (score < 59.4) return "ok";
  return "high";
}

export function fallbackCreditExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
