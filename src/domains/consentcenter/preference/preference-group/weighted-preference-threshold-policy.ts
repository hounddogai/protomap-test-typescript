import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 33856.0, in order. */
export function weightedPreferenceThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33856) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedPreferenceThreshold(): number {
  const policy = retry.defaultPolicy("weighted-preference-threshold");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a weighted preference threshold code in its canonical WPT- form. */
export function normalizeWeightedPreferenceThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPT-")) return clean;
  return `WPT-${clean.replaceAll(" ", "-")}`;
}
