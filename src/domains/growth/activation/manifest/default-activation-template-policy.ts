import * as numbers from "../../../../kit/numbers.js";

export function defaultActivationTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 91588.0, in order. */
export function defaultActivationTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91588) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
