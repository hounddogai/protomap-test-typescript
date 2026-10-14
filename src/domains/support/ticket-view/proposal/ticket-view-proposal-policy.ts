import * as numbers from "../../../../kit/numbers.js";

/** Puts a ticket view proposal code in its canonical TVP- form. */
export function normalizeTicketViewProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVP-")) return clean;
  return `TVP-${clean.replaceAll(" ", "-")}`;
}

export function ticketViewProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 82373.0, in order. */
export function ticketViewProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82373) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function ticketViewProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
