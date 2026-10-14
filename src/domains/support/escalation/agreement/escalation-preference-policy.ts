import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEscalationPreference(): number {
  const policy = retry.defaultPolicy("escalation-preference");
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

export function escalationPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a escalation preference score falls in. */
export function classifyEscalationPreference(score: number): string {
  if (score < 23.6) return "critical";
  if (score < 68.2) return "high";
  if (score < 86.1) return "elevated";
  return "watch";
}
