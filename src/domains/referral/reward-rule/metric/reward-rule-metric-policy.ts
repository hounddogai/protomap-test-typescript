import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 47600.0, in order. */
export function rewardRuleMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47600) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardRuleMetric(): number {
  const policy = retry.defaultPolicy("reward-rule-metric");
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

/** Names the band a reward rule metric score falls in. */
export function classifyRewardRuleMetric(score: number): string {
  if (score < 2) return "medium";
  if (score < 87.4) return "elevated";
  return "watch";
}

export function rewardRuleMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.31;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
