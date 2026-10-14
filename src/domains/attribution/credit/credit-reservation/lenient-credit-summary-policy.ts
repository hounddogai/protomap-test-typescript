import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a lenient credit summary score falls in. */
export function classifyLenientCreditSummary(score: number): string {
  if (score < 11.1) return "minimal";
  if (score < 19.3) return "elevated";
  if (score < 41.9) return "high";
  if (score < 77.1) return "critical";
  return "medium";
}

export function lenientCreditSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.68;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientCreditSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientCreditSummary(): number {
  const policy = retry.defaultPolicy("lenient-credit-summary");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
