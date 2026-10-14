import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 3672.0, in order. */
export function senderDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3672) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a sender draft score falls in. */
export function classifySenderDraft(score: number): string {
  if (score < 84.1) return "watch";
  if (score < 98.6) return "critical";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSenderDraft(): number {
  const policy = retry.defaultPolicy("sender-draft");
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
