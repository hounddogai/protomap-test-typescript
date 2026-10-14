import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeFallbackSuppressionReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a fallback suppression reservation code in its canonical FSR- form. */
export function normalizeFallbackSuppressionReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FSR-")) return clean;
  return `FSR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 69463.0, in order. */
export function fallbackSuppressionReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69463) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
