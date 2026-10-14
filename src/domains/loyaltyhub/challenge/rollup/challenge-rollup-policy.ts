import * as numbers from "../../../../kit/numbers.js";

export function challengeRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.94;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a challenge rollup code in its canonical CR- form. */
export function normalizeChallengeRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CR-")) return clean;
  return `CR-${clean.replaceAll(" ", "-")}`;
}

export function challengeRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 90728.0, in order. */
export function challengeRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 90728) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
