import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a scheduled challenge tier code in its canonical SCT- form. */
export function normalizeScheduledChallengeTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCT-")) return clean;
  return `SCT-${clean.replaceAll(" ", "-")}`;
}

export function mergeScheduledChallengeTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 12638.0, in order. */
export function scheduledChallengeTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12638) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
