import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 98997.0, in order. */
export function lenientJourneyAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98997) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientJourneyAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.94;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function lenientJourneyAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a lenient journey assignment code in its canonical LJA- form. */
export function normalizeLenientJourneyAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LJA-")) return clean;
  return `LJA-${clean.replaceAll(" ", "-")}`;
}
