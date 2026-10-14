import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 22442.0, in order. */
export function globalDeflectionCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22442) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a global deflection checkpoint code in its canonical GDC- form. */
export function normalizeGlobalDeflectionCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GDC-")) return clean;
  return `GDC-${clean.replaceAll(" ", "-")}`;
}

export function globalDeflectionCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.5;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function globalDeflectionCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
