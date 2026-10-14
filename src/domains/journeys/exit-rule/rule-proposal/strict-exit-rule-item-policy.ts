import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a strict exit rule item score falls in. */
export function classifyStrictExitRuleItem(score: number): string {
  if (score < 13.8) return "medium";
  if (score < 27.1) return "minimal";
  if (score < 53.1) return "critical";
  if (score < 95.3) return "watch";
  return "high";
}

export function mergeStrictExitRuleItemLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a strict exit rule item code in its canonical SERI- form. */
export function normalizeStrictExitRuleItemCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SERI-")) return clean;
  return `SERI-${clean.replaceAll(" ", "-")}`;
}

export function strictExitRuleItemBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
