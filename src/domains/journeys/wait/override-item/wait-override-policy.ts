import * as numbers from "../../../../kit/numbers.js";

export function waitOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 48240.0, in order. */
export function waitOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48240) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a wait override code in its canonical WO- form. */
export function normalizeWaitOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WO-")) return clean;
  return `WO-${clean.replaceAll(" ", "-")}`;
}
