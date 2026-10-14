import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeBidRuleReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a bid rule review code in its canonical BRR- form. */
export function normalizeBidRuleReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRR-")) return clean;
  return `BRR-${clean.replaceAll(" ", "-")}`;
}
