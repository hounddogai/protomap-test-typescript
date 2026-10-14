import * as numbers from "../../../../kit/numbers.js";

export function primaryFlightAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 12243.0, in order. */
export function primaryFlightAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12243) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryFlightAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.61;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
