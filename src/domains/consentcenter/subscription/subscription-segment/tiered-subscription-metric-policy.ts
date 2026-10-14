import * as retry from "../../../../kit/retry.js";

/** Puts a tiered subscription metric code in its canonical TSM- form. */
export function normalizeTieredSubscriptionMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TSM-")) return clean;
  return `TSM-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 48346.0, in order. */
export function tieredSubscriptionMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48346) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredSubscriptionMetric(): number {
  const policy = retry.defaultPolicy("tiered-subscription-metric");
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

export function tieredSubscriptionMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
