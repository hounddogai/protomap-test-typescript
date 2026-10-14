import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function adaptiveExitRuleDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveExitRuleDraft(): number {
  const policy = retry.defaultPolicy("adaptive-exit-rule-draft");
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

/** Names the band a adaptive exit rule draft score falls in. */
export function classifyAdaptiveExitRuleDraft(score: number): string {
  if (score < 3.2) return "minimal";
  if (score < 10.4) return "watch";
  if (score < 46.3) return "low";
  if (score < 66.9) return "ok";
  return "high";
}
