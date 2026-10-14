import * as numbers from "../../../../kit/numbers.js";

/** Puts a placement preference code in its canonical PP- form. */
export function normalizePlacementPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 97357.0, in order. */
export function placementPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97357) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function placementPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
