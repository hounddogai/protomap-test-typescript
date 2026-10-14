import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeScheduledLevelReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 66754.0, in order. */
export function scheduledLevelReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66754) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a scheduled level reservation code in its canonical SLR- form. */
export function normalizeScheduledLevelReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SLR-")) return clean;
  return `SLR-${clean.replaceAll(" ", "-")}`;
}
