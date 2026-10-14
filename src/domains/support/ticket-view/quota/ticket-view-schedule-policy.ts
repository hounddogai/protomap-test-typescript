import * as numbers from "../../../../kit/numbers.js";

/** Puts a ticket view schedule code in its canonical TVS- form. */
export function normalizeTicketViewScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVS-")) return clean;
  return `TVS-${clean.replaceAll(" ", "-")}`;
}

export function ticketViewScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.5;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
