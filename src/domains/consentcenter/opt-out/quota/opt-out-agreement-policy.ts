import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeOptOutAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a opt out agreement code in its canonical OOA- form. */
export function normalizeOptOutAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOA-")) return clean;
  return `OOA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 16511.0, in order. */
export function optOutAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 16511) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
