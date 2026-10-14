import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 1077.0, in order. */
export function globalSlaCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1077) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a global sla cycle code in its canonical GSC- form. */
export function normalizeGlobalSlaCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GSC-")) return clean;
  return `GSC-${clean.replaceAll(" ", "-")}`;
}

export function globalSlaCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function globalSlaCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
