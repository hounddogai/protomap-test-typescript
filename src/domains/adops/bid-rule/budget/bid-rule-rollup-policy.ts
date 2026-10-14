import * as numbers from "../../../../kit/numbers.js";

/** Puts a bid rule rollup code in its canonical BRR- form. */
export function normalizeBidRuleRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRR-")) return clean;
  return `BRR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 64105.0, in order. */
export function bidRuleRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64105) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function bidRuleRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.18;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function bidRuleRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
