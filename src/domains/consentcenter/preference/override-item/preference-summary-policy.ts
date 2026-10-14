import * as numbers from "../../../../kit/numbers.js";

/** Puts a preference summary code in its canonical PS- form. */
export function normalizePreferenceSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PS-")) return clean;
  return `PS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 66786.0, in order. */
export function preferenceSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66786) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function preferenceSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.9;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function preferenceSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
