import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function globalRewardRuleSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.76;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 85923.0, in order. */
export function globalRewardRuleSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85923) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalRewardRuleSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalRewardRuleSlot(): number {
  const policy = retry.defaultPolicy("global-reward-rule-slot");
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
