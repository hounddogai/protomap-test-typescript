import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 73121.0, in order. */
export function fallbackReputationReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73121) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackReputationReview(): number {
  const policy = retry.defaultPolicy("fallback-reputation-review");
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

/** Puts a fallback reputation review code in its canonical FRR- form. */
export function normalizeFallbackReputationReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FRR-")) return clean;
  return `FRR-${clean.replaceAll(" ", "-")}`;
}
