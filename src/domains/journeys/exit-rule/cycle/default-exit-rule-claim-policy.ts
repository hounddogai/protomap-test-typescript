import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function defaultExitRuleClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultExitRuleClaim(): number {
  const policy = retry.defaultPolicy("default-exit-rule-claim");
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

/** Names the band a default exit rule claim score falls in. */
export function classifyDefaultExitRuleClaim(score: number): string {
  if (score < 18.1) return "elevated";
  if (score < 72.6) return "ok";
  if (score < 78.2) return "minimal";
  if (score < 79.4) return "critical";
  return "low";
}
