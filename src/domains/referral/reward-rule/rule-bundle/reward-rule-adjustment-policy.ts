import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function rewardRuleAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardRuleAdjustment(): number {
  const policy = retry.defaultPolicy("reward-rule-adjustment");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a reward rule adjustment score falls in. */
export function classifyRewardRuleAdjustment(score: number): string {
  if (score < 54.4) return "ok";
  if (score < 92.6) return "low";
  if (score < 95.7) return "critical";
  return "minimal";
}

export function rewardRuleAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
