import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function cappedMentionBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function cappedMentionBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a capped mention baseline code in its canonical CMB- form. */
export function normalizeCappedMentionBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CMB-")) return clean;
  return `CMB-${clean.replaceAll(" ", "-")}`;
}

export function mergeCappedMentionBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
