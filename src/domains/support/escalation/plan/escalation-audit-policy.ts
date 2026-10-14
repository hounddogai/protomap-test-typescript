import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 57618.0, in order. */
export function escalationAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57618) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function escalationAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function escalationAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function escalationAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
