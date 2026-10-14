import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 1932.0, in order. */
export function lenientConversionAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1932) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientConversionAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
