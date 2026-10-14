import * as numbers from "../../../../kit/numbers.js";

export function ticketViewQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a ticket view quota code in its canonical TVQ- form. */
export function normalizeTicketViewQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVQ-")) return clean;
  return `TVQ-${clean.replaceAll(" ", "-")}`;
}
