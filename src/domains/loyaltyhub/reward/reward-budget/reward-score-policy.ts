import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 50203.0, in order. */
export function rewardScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50203) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rewardScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a reward score score falls in. */
export function classifyRewardScore(score: number): string {
  if (score < 17.1) return "critical";
  if (score < 32.8) return "low";
  if (score < 40.9) return "minimal";
  if (score < 41) return "medium";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardScore(): number {
  const policy = retry.defaultPolicy("reward-score");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
