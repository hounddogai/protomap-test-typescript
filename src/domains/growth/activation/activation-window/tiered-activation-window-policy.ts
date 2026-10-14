import * as retry from "../../../../kit/retry.js";

/** Puts a tiered activation window code in its canonical TAW- form. */
export function normalizeTieredActivationWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TAW-")) return clean;
  return `TAW-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredActivationWindow(): number {
  const policy = retry.defaultPolicy("tiered-activation-window");
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

/** Counts how many amounts fit in a budget of 30084.0, in order. */
export function tieredActivationWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30084) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredActivationWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
