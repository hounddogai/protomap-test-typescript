import * as retry from "../../../../kit/retry.js";

/** Puts a weighted preference exception code in its canonical WPE- form. */
export function normalizeWeightedPreferenceExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPE-")) return clean;
  return `WPE-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedPreferenceException(): number {
  const policy = retry.defaultPolicy("weighted-preference-exception");
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

/** Counts how many amounts fit in a budget of 96979.0, in order. */
export function weightedPreferenceExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96979) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function weightedPreferenceExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
