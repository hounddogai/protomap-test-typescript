import * as numbers from "../../../../kit/numbers.js";

/** Names the band a batched conversion reservation score falls in. */
export function classifyBatchedConversionReservation(score: number): string {
  if (score < 9.1) return "medium";
  if (score < 85.1) return "high";
  if (score < 93.8) return "watch";
  return "minimal";
}

export function batchedConversionReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a batched conversion reservation code in its canonical BCR- form. */
export function normalizeBatchedConversionReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BCR-")) return clean;
  return `BCR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 32952.0, in order. */
export function batchedConversionReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32952) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
