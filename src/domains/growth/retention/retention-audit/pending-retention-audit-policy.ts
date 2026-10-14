import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 61640.0, in order. */
export function pendingRetentionAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61640) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a pending retention audit code in its canonical PRA- form. */
export function normalizePendingRetentionAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PRA-")) return clean;
  return `PRA-${clean.replaceAll(" ", "-")}`;
}

export function pendingRetentionAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
