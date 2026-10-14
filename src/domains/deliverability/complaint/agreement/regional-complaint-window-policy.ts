import * as numbers from "../../../../kit/numbers.js";

export function regionalComplaintWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a regional complaint window code in its canonical RCW- form. */
export function normalizeRegionalComplaintWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCW-")) return clean;
  return `RCW-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 49254.0, in order. */
export function regionalComplaintWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49254) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a regional complaint window score falls in. */
export function classifyRegionalComplaintWindow(score: number): string {
  if (score < 18) return "ok";
  if (score < 86.6) return "minimal";
  return "elevated";
}
