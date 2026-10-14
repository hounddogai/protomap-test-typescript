import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 81874.0, in order. */
export function bidRuleRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81874) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function bidRuleRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
