import * as numbers from "../../../../kit/numbers.js";

export function primaryFraudCheckDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 80702.0, in order. */
export function primaryFraudCheckDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 80702) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryFraudCheckDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function primaryFraudCheckDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
