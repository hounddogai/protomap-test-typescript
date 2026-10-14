import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function strictExitRuleDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.05;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function strictExitRuleDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictExitRuleDraft(): number {
  const policy = retry.defaultPolicy("strict-exit-rule-draft");
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

/** Names the band a strict exit rule draft score falls in. */
export function classifyStrictExitRuleDraft(score: number): string {
  if (score < 1.2) return "low";
  if (score < 34.7) return "medium";
  if (score < 53.3) return "critical";
  if (score < 93) return "high";
  return "minimal";
}
