import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 3096.0, in order. */
export function primaryModelDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3096) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a primary model draft score falls in. */
export function classifyPrimaryModelDraft(score: number): string {
  if (score < 15.6) return "ok";
  if (score < 99.1) return "medium";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryModelDraft(): number {
  const policy = retry.defaultPolicy("primary-model-draft");
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
