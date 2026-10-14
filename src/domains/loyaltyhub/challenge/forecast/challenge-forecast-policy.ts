import * as numbers from "../../../../kit/numbers.js";

export function challengeForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.44;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a challenge forecast code in its canonical CF- form. */
export function normalizeChallengeForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CF-")) return clean;
  return `CF-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 3354.0, in order. */
export function challengeForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3354) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function challengeForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
