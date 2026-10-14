import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function manualFlightClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function mergeManualFlightClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a manual flight claim code in its canonical MFC- form. */
export function normalizeManualFlightClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MFC-")) return clean;
  return `MFC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 1172.0, in order. */
export function manualFlightClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1172) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
