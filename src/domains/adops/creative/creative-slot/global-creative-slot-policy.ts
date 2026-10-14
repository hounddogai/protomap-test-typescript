import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 10910.0, in order. */
export function globalCreativeSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 10910) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalCreativeSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a global creative slot code in its canonical GCS- form. */
export function normalizeGlobalCreativeSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GCS-")) return clean;
  return `GCS-${clean.replaceAll(" ", "-")}`;
}

export function mergeGlobalCreativeSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
