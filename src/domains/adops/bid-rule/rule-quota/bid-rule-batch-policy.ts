import * as numbers from "../../../../kit/numbers.js";

/** Puts a bid rule batch code in its canonical BRB- form. */
export function normalizeBidRuleBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRB-")) return clean;
  return `BRB-${clean.replaceAll(" ", "-")}`;
}

export function bidRuleBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.03;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
