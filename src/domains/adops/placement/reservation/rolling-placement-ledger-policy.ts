import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function rollingPlacementLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function mergeRollingPlacementLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingPlacementLedger(): number {
  const policy = retry.defaultPolicy("rolling-placement-ledger");
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

/** Counts how many amounts fit in a budget of 32475.0, in order. */
export function rollingPlacementLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32475) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
