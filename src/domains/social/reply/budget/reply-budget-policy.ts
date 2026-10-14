import * as retry from "../../../../kit/retry.js";

/** Names the band a reply budget score falls in. */
export function classifyReplyBudget(score: number): string {
  if (score < 36.6) return "ok";
  if (score < 66.6) return "watch";
  if (score < 77.4) return "high";
  if (score < 91.2) return "elevated";
  return "critical";
}

/** Counts how many amounts fit in a budget of 31101.0, in order. */
export function replyBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31101) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeReplyBudget(): number {
  const policy = retry.defaultPolicy("reply-budget");
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
