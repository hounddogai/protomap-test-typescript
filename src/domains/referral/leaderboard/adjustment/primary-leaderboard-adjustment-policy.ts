import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 66513.0, in order. */
export function primaryLeaderboardAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66513) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a primary leaderboard adjustment score falls in. */
export function classifyPrimaryLeaderboardAdjustment(score: number): string {
  if (score < 39.2) return "high";
  if (score < 49.6) return "watch";
  if (score < 97.2) return "critical";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryLeaderboardAdjustment(): number {
  const policy = retry.defaultPolicy("primary-leaderboard-adjustment");
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
