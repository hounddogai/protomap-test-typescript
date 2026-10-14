import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 12945.0, in order. */
export function mentionLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12945) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mentionLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a mention ledger score falls in. */
export function classifyMentionLedger(score: number): string {
  if (score < 36.3) return "low";
  if (score < 44.9) return "critical";
  if (score < 60.9) return "watch";
  return "minimal";
}

/** Puts a mention ledger code in its canonical ML- form. */
export function normalizeMentionLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ML-")) return clean;
  return `ML-${clean.replaceAll(" ", "-")}`;
}
