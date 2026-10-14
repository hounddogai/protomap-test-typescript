import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveWarmupReview(): number {
  const policy = retry.defaultPolicy("adaptive-warmup-review");
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

/** Puts a adaptive warmup review code in its canonical AWR- form. */
export function normalizeAdaptiveWarmupReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AWR-")) return clean;
  return `AWR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a adaptive warmup review score falls in. */
export function classifyAdaptiveWarmupReview(score: number): string {
  if (score < 36.5) return "medium";
  if (score < 74.1) return "watch";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 25472.0, in order. */
export function adaptiveWarmupReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25472) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
