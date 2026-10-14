import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryActivationReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a primary activation reservation score falls in. */
export function classifyPrimaryActivationReservation(score: number): string {
  if (score < 24.7) return "medium";
  if (score < 25.8) return "high";
  if (score < 77.9) return "watch";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 63127.0, in order. */
export function primaryActivationReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 63127) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary activation reservation code in its canonical PAR- form. */
export function normalizePrimaryActivationReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PAR-")) return clean;
  return `PAR-${clean.replaceAll(" ", "-")}`;
}
