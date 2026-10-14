import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a global approval record code in its canonical GAR- form. */
export function normalizeGlobalApprovalRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GAR-")) return clean;
  return `GAR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 77914.0, in order. */
export function globalApprovalRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 77914) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeGlobalApprovalRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
