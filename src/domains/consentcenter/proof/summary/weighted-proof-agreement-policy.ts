import * as numbers from "../../../../kit/numbers.js";

export function weightedProofAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 92597.0, in order. */
export function weightedProofAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92597) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function weightedProofAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a weighted proof agreement code in its canonical WPA- form. */
export function normalizeWeightedProofAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WPA-")) return clean;
  return `WPA-${clean.replaceAll(" ", "-")}`;
}
