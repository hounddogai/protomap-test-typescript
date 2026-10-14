import * as numbers from "../../../../kit/numbers.js";

export function regionalPlacementProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function regionalPlacementProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a regional placement proposal code in its canonical RPP- form. */
export function normalizeRegionalPlacementProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPP-")) return clean;
  return `RPP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 32450.0, in order. */
export function regionalPlacementProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32450) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
