import * as numbers from "../../../../kit/numbers.js";

/** Puts a capped model snapshot code in its canonical CMS- form. */
export function normalizeCappedModelSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CMS-")) return clean;
  return `CMS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 97410.0, in order. */
export function cappedModelSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97410) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function cappedModelSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function cappedModelSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.9;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
