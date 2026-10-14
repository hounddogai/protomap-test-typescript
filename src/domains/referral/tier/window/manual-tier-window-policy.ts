import * as numbers from "../../../../kit/numbers.js";

export function manualTierWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function manualTierWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 13008.0, in order. */
export function manualTierWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 13008) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a manual tier window code in its canonical MTW- form. */
export function normalizeManualTierWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MTW-")) return clean;
  return `MTW-${clean.replaceAll(" ", "-")}`;
}
