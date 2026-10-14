import * as retry from "../../../../kit/retry.js";

/** Puts a reward rule cycle code in its canonical RRC- form. */
export function normalizeRewardRuleCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRC-")) return clean;
  return `RRC-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardRuleCycle(): number {
  const policy = retry.defaultPolicy("reward-rule-cycle");
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

/** Counts how many amounts fit in a budget of 86034.0, in order. */
export function rewardRuleCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 86034) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
