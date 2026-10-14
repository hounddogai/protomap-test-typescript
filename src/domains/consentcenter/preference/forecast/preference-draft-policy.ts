import * as numbers from "../../../../kit/numbers.js";

export function preferenceDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 8687.0, in order. */
export function preferenceDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8687) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a preference draft code in its canonical PD- form. */
export function normalizePreferenceDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PD-")) return clean;
  return `PD-${clean.replaceAll(" ", "-")}`;
}
