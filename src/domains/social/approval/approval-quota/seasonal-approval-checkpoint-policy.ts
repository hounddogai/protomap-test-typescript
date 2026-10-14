import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function seasonalApprovalCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a seasonal approval checkpoint code in its canonical SAC- form. */
export function normalizeSeasonalApprovalCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SAC-")) return clean;
  return `SAC-${clean.replaceAll(" ", "-")}`;
}

export function mergeSeasonalApprovalCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 59732.0, in order. */
export function seasonalApprovalCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59732) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
