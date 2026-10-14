import * as numbers from "../../../../kit/numbers.js";

export function ticketViewMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function ticketViewMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a ticket view mapping code in its canonical TVM- form. */
export function normalizeTicketViewMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVM-")) return clean;
  return `TVM-${clean.replaceAll(" ", "-")}`;
}
