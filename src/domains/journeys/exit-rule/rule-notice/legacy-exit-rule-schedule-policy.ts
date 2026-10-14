import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a legacy exit rule schedule score falls in. */
export function classifyLegacyExitRuleSchedule(score: number): string {
  if (score < 25.7) return "watch";
  if (score < 79.9) return "ok";
  if (score < 84.4) return "minimal";
  if (score < 99.4) return "low";
  return "elevated";
}

export function legacyExitRuleScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyExitRuleSchedule(): number {
  const policy = retry.defaultPolicy("legacy-exit-rule-schedule");
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

export function legacyExitRuleScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
