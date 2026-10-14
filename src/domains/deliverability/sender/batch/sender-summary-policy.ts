import * as numbers from "../../../../kit/numbers.js";

/** Names the band a sender summary score falls in. */
export function classifySenderSummary(score: number): string {
  if (score < 11.2) return "watch";
  if (score < 45.5) return "ok";
  if (score < 81.9) return "elevated";
  if (score < 85.1) return "high";
  return "medium";
}

/** Puts a sender summary code in its canonical SS- form. */
export function normalizeSenderSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SS-")) return clean;
  return `SS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 41210.0, in order. */
export function senderSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41210) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function senderSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
