import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 54761.0, in order. */
export function batchedPlacementDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54761) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a batched placement draft score falls in. */
export function classifyBatchedPlacementDraft(score: number): string {
  if (score < 15.7) return "watch";
  if (score < 77.4) return "minimal";
  if (score < 91.6) return "ok";
  if (score < 97.4) return "medium";
  return "high";
}

export function batchedPlacementDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a batched placement draft code in its canonical BPD- form. */
export function normalizeBatchedPlacementDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPD-")) return clean;
  return `BPD-${clean.replaceAll(" ", "-")}`;
}
