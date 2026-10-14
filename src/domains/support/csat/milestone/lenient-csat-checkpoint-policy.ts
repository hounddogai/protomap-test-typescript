import * as numbers from "../../../../kit/numbers.js";

/** Puts a lenient csat checkpoint code in its canonical LCC- form. */
export function normalizeLenientCsatCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCC-")) return clean;
  return `LCC-${clean.replaceAll(" ", "-")}`;
}

export function lenientCsatCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 94829.0, in order. */
export function lenientCsatCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94829) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientCsatCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
