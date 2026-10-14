import * as numbers from "../../../../kit/numbers.js";

export function ticketViewSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a ticket view summary code in its canonical TVS- form. */
export function normalizeTicketViewSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVS-")) return clean;
  return `TVS-${clean.replaceAll(" ", "-")}`;
}

export function ticketViewSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
