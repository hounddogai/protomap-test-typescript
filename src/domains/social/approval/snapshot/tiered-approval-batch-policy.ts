import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 31491.0, in order. */
export function tieredApprovalBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31491) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeTieredApprovalBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a tiered approval batch code in its canonical TAB- form. */
export function normalizeTieredApprovalBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TAB-")) return clean;
  return `TAB-${clean.replaceAll(" ", "-")}`;
}
