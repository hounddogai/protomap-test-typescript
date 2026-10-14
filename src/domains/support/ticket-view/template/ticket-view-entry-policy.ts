import * as numbers from "../../../../kit/numbers.js";

export function ticketViewEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 89973.0, in order. */
export function ticketViewEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89973) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function ticketViewEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.94;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a ticket view entry code in its canonical TVE- form. */
export function normalizeTicketViewEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVE-")) return clean;
  return `TVE-${clean.replaceAll(" ", "-")}`;
}
