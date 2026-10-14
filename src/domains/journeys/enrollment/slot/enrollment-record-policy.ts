import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 72362.0, in order. */
export function enrollmentRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72362) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a enrollment record code in its canonical ER- form. */
export function normalizeEnrollmentRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ER-")) return clean;
  return `ER-${clean.replaceAll(" ", "-")}`;
}

export function mergeEnrollmentRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
