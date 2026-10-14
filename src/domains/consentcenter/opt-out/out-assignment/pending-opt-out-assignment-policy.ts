import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 551.0, in order. */
export function pendingOptOutAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 551) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a pending opt out assignment code in its canonical POOA- form. */
export function normalizePendingOptOutAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("POOA-")) return clean;
  return `POOA-${clean.replaceAll(" ", "-")}`;
}

export function pendingOptOutAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
