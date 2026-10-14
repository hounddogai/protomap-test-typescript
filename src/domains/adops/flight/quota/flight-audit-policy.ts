import * as numbers from "../../../../kit/numbers.js";

export function flightAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.61;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 8011.0, in order. */
export function flightAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8011) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a flight audit code in its canonical FA- form. */
export function normalizeFlightAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FA-")) return clean;
  return `FA-${clean.replaceAll(" ", "-")}`;
}
