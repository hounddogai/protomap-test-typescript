import * as numbers from "../../../../kit/numbers.js";

export function proofCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 86719.0, in order. */
export function proofCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 86719) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a proof checkpoint code in its canonical PC- form. */
export function normalizeProofCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PC-")) return clean;
  return `PC-${clean.replaceAll(" ", "-")}`;
}
