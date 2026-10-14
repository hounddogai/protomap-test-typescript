import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a deflection rule score falls in. */
export function classifyDeflectionRule(score: number): string {
  if (score < 16.5) return "low";
  if (score < 44.9) return "elevated";
  if (score < 52.8) return "critical";
  if (score < 56.2) return "watch";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDeflectionRule(): number {
  const policy = retry.defaultPolicy("deflection-rule");
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

export function deflectionRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function deflectionRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
