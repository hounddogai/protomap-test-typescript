import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function rewardRuleExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardRuleException(): number {
  const policy = retry.defaultPolicy("reward-rule-exception");
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

/** Counts how many amounts fit in a budget of 33656.0, in order. */
export function rewardRuleExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33656) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
