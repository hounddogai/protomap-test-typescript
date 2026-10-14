import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 3769.0, in order. */
export function pendingMentionScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3769) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingMentionScore(): number {
  const policy = retry.defaultPolicy("pending-mention-score");
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
