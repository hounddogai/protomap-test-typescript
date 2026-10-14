import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeRollingBidRulePreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 67060.0, in order. */
export function rollingBidRulePreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67060) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a rolling bid rule preference code in its canonical RBRP- form. */
export function normalizeRollingBidRulePreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RBRP-")) return clean;
  return `RBRP-${clean.replaceAll(" ", "-")}`;
}
