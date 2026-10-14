import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledChallengeLedger(): number {
  const policy = retry.defaultPolicy("scheduled-challenge-ledger");
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

/** Puts a scheduled challenge ledger code in its canonical SCL- form. */
export function normalizeScheduledChallengeLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCL-")) return clean;
  return `SCL-${clean.replaceAll(" ", "-")}`;
}

export function scheduledChallengeLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 7898.0, in order. */
export function scheduledChallengeLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7898) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
