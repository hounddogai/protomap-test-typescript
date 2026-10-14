import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeManualSlaDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a manual sla digest code in its canonical MSD- form. */
export function normalizeManualSlaDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MSD-")) return clean;
  return `MSD-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 77929.0, in order. */
export function manualSlaDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 77929) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function manualSlaDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
