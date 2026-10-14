import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function slaBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a sla budget score falls in. */
export function classifySlaBudget(score: number): string {
  if (score < 5.7) return "watch";
  if (score < 9.4) return "ok";
  if (score < 41.9) return "medium";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSlaBudget(): number {
  const policy = retry.defaultPolicy("sla-budget");
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
