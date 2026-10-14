import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 21644.0, in order. */
export function windowLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21644) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a window ledger code in its canonical WL- form. */
export function normalizeWindowLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WL-")) return clean;
  return `WL-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWindowLedger(): number {
  const policy = retry.defaultPolicy("window-ledger");
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

export function windowLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
