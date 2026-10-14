import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a legacy double opt in reservation code in its canonical LDOIR- form. */
export function normalizeLegacyDoubleOptInReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LDOIR-")) return clean;
  return `LDOIR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 38044.0, in order. */
export function legacyDoubleOptInReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38044) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeLegacyDoubleOptInReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
