import * as numbers from "../../../../kit/numbers.js";

/** Puts a adaptive deflection window code in its canonical ADW- form. */
export function normalizeAdaptiveDeflectionWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ADW-")) return clean;
  return `ADW-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveDeflectionWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function adaptiveDeflectionWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.78;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 27241.0, in order. */
export function adaptiveDeflectionWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 27241) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
