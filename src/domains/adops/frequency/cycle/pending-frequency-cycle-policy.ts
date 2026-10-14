import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function pendingFrequencyCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function mergePendingFrequencyCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 3657.0, in order. */
export function pendingFrequencyCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3657) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a pending frequency cycle code in its canonical PFC- form. */
export function normalizePendingFrequencyCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PFC-")) return clean;
  return `PFC-${clean.replaceAll(" ", "-")}`;
}
