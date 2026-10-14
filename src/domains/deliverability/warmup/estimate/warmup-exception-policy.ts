import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 9505.0, in order. */
export function warmupExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 9505) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a warmup exception code in its canonical WE- form. */
export function normalizeWarmupExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WE-")) return clean;
  return `WE-${clean.replaceAll(" ", "-")}`;
}

export function warmupExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

export function warmupExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
