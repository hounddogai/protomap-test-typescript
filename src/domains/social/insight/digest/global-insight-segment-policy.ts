import * as numbers from "../../../../kit/numbers.js";

/** Puts a global insight segment code in its canonical GIS- form. */
export function normalizeGlobalInsightSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GIS-")) return clean;
  return `GIS-${clean.replaceAll(" ", "-")}`;
}

export function globalInsightSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 91650.0, in order. */
export function globalInsightSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91650) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalInsightSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
