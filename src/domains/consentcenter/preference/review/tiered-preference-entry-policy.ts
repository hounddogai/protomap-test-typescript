import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredPreferenceEntry(): number {
  const policy = retry.defaultPolicy("tiered-preference-entry");
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

export function tieredPreferenceEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a tiered preference entry score falls in. */
export function classifyTieredPreferenceEntry(score: number): string {
  if (score < 52.8) return "elevated";
  if (score < 71.8) return "ok";
  return "low";
}

/** Counts how many amounts fit in a budget of 66925.0, in order. */
export function tieredPreferenceEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66925) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
