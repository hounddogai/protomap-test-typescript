import * as numbers from "../../../../kit/numbers.js";

export function defaultProofBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 32663.0, in order. */
export function defaultProofBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32663) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a default proof batch code in its canonical DPB- form. */
export function normalizeDefaultProofBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPB-")) return clean;
  return `DPB-${clean.replaceAll(" ", "-")}`;
}

export function defaultProofBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
