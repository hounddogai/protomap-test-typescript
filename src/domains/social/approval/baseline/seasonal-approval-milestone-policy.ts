import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 78672.0, in order. */
export function seasonalApprovalMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78672) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a seasonal approval milestone code in its canonical SAM- form. */
export function normalizeSeasonalApprovalMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SAM-")) return clean;
  return `SAM-${clean.replaceAll(" ", "-")}`;
}

export function mergeSeasonalApprovalMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function seasonalApprovalMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
