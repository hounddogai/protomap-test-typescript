import * as numbers from "../../../../kit/numbers.js";

export function inviteAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.87;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a invite audit code in its canonical IA- form. */
export function normalizeInviteAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IA-")) return clean;
  return `IA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 38998.0, in order. */
export function inviteAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38998) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
