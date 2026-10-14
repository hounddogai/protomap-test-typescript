import * as numbers from "../../../../kit/numbers.js";

export function scheduledReplyLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a scheduled reply ledger code in its canonical SRL- form. */
export function normalizeScheduledReplyLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRL-")) return clean;
  return `SRL-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 46413.0, in order. */
export function scheduledReplyLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 46413) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
