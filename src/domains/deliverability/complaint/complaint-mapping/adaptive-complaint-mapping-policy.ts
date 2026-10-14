import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 90701.0, in order. */
export function adaptiveComplaintMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 90701) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeAdaptiveComplaintMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function adaptiveComplaintMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a adaptive complaint mapping code in its canonical ACM- form. */
export function normalizeAdaptiveComplaintMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ACM-")) return clean;
  return `ACM-${clean.replaceAll(" ", "-")}`;
}
