import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a legacy streak tier code in its canonical LST- form. */
export function normalizeLegacyStreakTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LST-")) return clean;
  return `LST-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 86564.0, in order. */
export function legacyStreakTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 86564) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeLegacyStreakTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a legacy streak tier score falls in. */
export function classifyLegacyStreakTier(score: number): string {
  if (score < 38.1) return "watch";
  if (score < 50.9) return "elevated";
  if (score < 53.2) return "low";
  return "critical";
}
