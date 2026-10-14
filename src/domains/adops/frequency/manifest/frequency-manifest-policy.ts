import * as numbers from "../../../../kit/numbers.js";

/** Puts a frequency manifest code in its canonical FM- form. */
export function normalizeFrequencyManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FM-")) return clean;
  return `FM-${clean.replaceAll(" ", "-")}`;
}

export function frequencyManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.07;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function frequencyManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 94215.0, in order. */
export function frequencyManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94215) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
