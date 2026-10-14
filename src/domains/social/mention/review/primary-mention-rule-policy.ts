import * as numbers from "../../../../kit/numbers.js";

/** Puts a primary mention rule code in its canonical PMR- form. */
export function normalizePrimaryMentionRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PMR-")) return clean;
  return `PMR-${clean.replaceAll(" ", "-")}`;
}

export function primaryMentionRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
