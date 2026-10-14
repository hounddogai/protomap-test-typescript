import * as numbers from "../../../../kit/numbers.js";

export function scheduledProofAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 54092.0, in order. */
export function scheduledProofAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54092) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
