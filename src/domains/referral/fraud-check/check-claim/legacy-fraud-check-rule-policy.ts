import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a legacy fraud check rule code in its canonical LFCR- form. */
export function normalizeLegacyFraudCheckRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFCR-")) return clean;
  return `LFCR-${clean.replaceAll(" ", "-")}`;
}

export function mergeLegacyFraudCheckRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function legacyFraudCheckRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
