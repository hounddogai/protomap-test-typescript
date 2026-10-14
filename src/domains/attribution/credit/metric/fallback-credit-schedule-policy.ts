import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a fallback credit schedule score falls in. */
export function classifyFallbackCreditSchedule(score: number): string {
  if (score < 44) return "low";
  if (score < 56.6) return "ok";
  if (score < 85.5) return "medium";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackCreditSchedule(): number {
  const policy = retry.defaultPolicy("fallback-credit-schedule");
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

export function fallbackCreditScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
