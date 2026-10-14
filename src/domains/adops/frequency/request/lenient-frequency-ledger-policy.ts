import * as numbers from "../../../../kit/numbers.js";

export function lenientFrequencyLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 52357.0, in order. */
export function lenientFrequencyLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52357) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientFrequencyLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
