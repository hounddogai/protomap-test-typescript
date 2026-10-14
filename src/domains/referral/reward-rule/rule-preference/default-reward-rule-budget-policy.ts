import * as retry from "../../../../kit/retry.js";

/** Names the band a default reward rule budget score falls in. */
export function classifyDefaultRewardRuleBudget(score: number): string {
  if (score < 8.5) return "medium";
  if (score < 20.4) return "elevated";
  if (score < 39.9) return "minimal";
  return "watch";
}

export function defaultRewardRuleBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 47580.0, in order. */
export function defaultRewardRuleBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47580) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultRewardRuleBudget(): number {
  const policy = retry.defaultPolicy("default-reward-rule-budget");
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
