import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 57327.0, in order. */
export function lenientPlacementDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57327) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a lenient placement digest code in its canonical LPD- form. */
export function normalizeLenientPlacementDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPD-")) return clean;
  return `LPD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a lenient placement digest score falls in. */
export function classifyLenientPlacementDigest(score: number): string {
  if (score < 20) return "watch";
  if (score < 26.7) return "low";
  if (score < 54.8) return "minimal";
  if (score < 59.3) return "medium";
  return "elevated";
}

export function mergeLenientPlacementDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
