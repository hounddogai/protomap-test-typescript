import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 44952.0, in order. */
export function rewardWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44952) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rewardWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.68;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardWindow(): number {
  const policy = retry.defaultPolicy("reward-window");
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
