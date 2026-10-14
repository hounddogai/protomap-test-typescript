import * as numbers from "../../../../kit/numbers.js";

export function warmupWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a warmup window code in its canonical WW- form. */
export function normalizeWarmupWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WW-")) return clean;
  return `WW-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 9927.0, in order. */
export function warmupWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 9927) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function warmupWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
