import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 13335.0, in order. */
export function legacyInviteRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 13335) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function legacyInviteRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function legacyInviteRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
