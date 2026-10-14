import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 54533.0, in order. */
export function complaintManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54533) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function complaintManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function complaintManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
