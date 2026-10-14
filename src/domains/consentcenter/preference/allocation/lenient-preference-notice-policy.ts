import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a lenient preference notice score falls in. */
export function classifyLenientPreferenceNotice(score: number): string {
  if (score < 23.7) return "ok";
  if (score < 45) return "high";
  if (score < 67.6) return "minimal";
  return "watch";
}

/** Counts how many amounts fit in a budget of 21898.0, in order. */
export function lenientPreferenceNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21898) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeLenientPreferenceNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a lenient preference notice code in its canonical LPN- form. */
export function normalizeLenientPreferenceNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPN-")) return clean;
  return `LPN-${clean.replaceAll(" ", "-")}`;
}
