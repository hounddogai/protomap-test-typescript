import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function rewardRuleRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardRuleRollup(): number {
  const policy = retry.defaultPolicy("reward-rule-rollup");
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
