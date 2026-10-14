import * as numbers from "../../../../kit/numbers.js";

/** Names the band a lenient queue proposal score falls in. */
export function classifyLenientQueueProposal(score: number): string {
  if (score < 27.5) return "low";
  if (score < 98.6) return "high";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 54865.0, in order. */
export function lenientQueueProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54865) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a lenient queue proposal code in its canonical LQP- form. */
export function normalizeLenientQueueProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LQP-")) return clean;
  return `LQP-${clean.replaceAll(" ", "-")}`;
}

export function lenientQueueProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
