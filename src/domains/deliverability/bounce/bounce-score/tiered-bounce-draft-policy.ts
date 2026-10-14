import * as retry from "../../../../kit/retry.js";

/** Names the band a tiered bounce draft score falls in. */
export function classifyTieredBounceDraft(score: number): string {
  if (score < 20.3) return "medium";
  if (score < 36.5) return "high";
  if (score < 47.4) return "minimal";
  if (score < 71.8) return "low";
  return "watch";
}

/** Counts how many amounts fit in a budget of 67747.0, in order. */
export function tieredBounceDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67747) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredBounceDraft(): number {
  const policy = retry.defaultPolicy("tiered-bounce-draft");
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

export function tieredBounceDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
