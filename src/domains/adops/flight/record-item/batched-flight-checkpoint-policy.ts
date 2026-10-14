import * as numbers from "../../../../kit/numbers.js";

export function batchedFlightCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function batchedFlightCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 59440.0, in order. */
export function batchedFlightCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59440) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a batched flight checkpoint code in its canonical BFC- form. */
export function normalizeBatchedFlightCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BFC-")) return clean;
  return `BFC-${clean.replaceAll(" ", "-")}`;
}
