import * as numbers from "../../../../kit/numbers.js";

export function legacyTicketViewAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.01;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 19349.0, in order. */
export function legacyTicketViewAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19349) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function legacyTicketViewAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
