import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function batchedCreditRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.5;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeBatchedCreditRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a batched credit record code in its canonical BCR- form. */
export function normalizeBatchedCreditRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BCR-")) return clean;
  return `BCR-${clean.replaceAll(" ", "-")}`;
}
