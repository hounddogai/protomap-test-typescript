import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a capped nudge allocation code in its canonical CNA- form. */
export function normalizeCappedNudgeAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CNA-")) return clean;
  return `CNA-${clean.replaceAll(" ", "-")}`;
}

export function cappedNudgeAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function cappedNudgeAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function mergeCappedNudgeAllocationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
