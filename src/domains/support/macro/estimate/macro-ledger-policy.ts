import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeMacroLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a macro ledger score falls in. */
export function classifyMacroLedger(score: number): string {
  if (score < 5.7) return "ok";
  if (score < 40.4) return "low";
  if (score < 41.3) return "critical";
  if (score < 75.1) return "medium";
  return "high";
}

/** Counts how many amounts fit in a budget of 98404.0, in order. */
export function macroLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98404) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
