import * as numbers from "../../../../kit/numbers.js";

export function ticketViewTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function ticketViewTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a ticket view tier code in its canonical TVT- form. */
export function normalizeTicketViewTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVT-")) return clean;
  return `TVT-${clean.replaceAll(" ", "-")}`;
}

export function ticketViewTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
