import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a manual reward rule metric code in its canonical MRRM- form. */
export function normalizeManualRewardRuleMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MRRM-")) return clean;
  return `MRRM-${clean.replaceAll(" ", "-")}`;
}

export function mergeManualRewardRuleMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function manualRewardRuleMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
