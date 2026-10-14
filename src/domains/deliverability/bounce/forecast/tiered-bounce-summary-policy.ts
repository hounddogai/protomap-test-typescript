import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredBounceSummary(): number {
  const policy = retry.defaultPolicy("tiered-bounce-summary");
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

/** Puts a tiered bounce summary code in its canonical TBS- form. */
export function normalizeTieredBounceSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TBS-")) return clean;
  return `TBS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 7556.0, in order. */
export function tieredBounceSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7556) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredBounceSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
