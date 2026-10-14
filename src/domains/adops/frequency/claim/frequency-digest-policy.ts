import * as numbers from "../../../../kit/numbers.js";

export function frequencyDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 41564.0, in order. */
export function frequencyDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41564) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a frequency digest code in its canonical FD- form. */
export function normalizeFrequencyDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FD-")) return clean;
  return `FD-${clean.replaceAll(" ", "-")}`;
}
