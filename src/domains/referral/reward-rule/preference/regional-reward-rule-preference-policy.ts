import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalRewardRulePreference(): number {
  const policy = retry.defaultPolicy("regional-reward-rule-preference");
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

export function regionalRewardRulePreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 8085.0, in order. */
export function regionalRewardRulePreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8085) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function regionalRewardRulePreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
