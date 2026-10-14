import * as numbers from "../../../../kit/numbers.js";

export function cappedDomainThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a capped domain threshold code in its canonical CDT- form. */
export function normalizeCappedDomainThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CDT-")) return clean;
  return `CDT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a capped domain threshold score falls in. */
export function classifyCappedDomainThreshold(score: number): string {
  if (score < 19) return "minimal";
  if (score < 77.6) return "elevated";
  return "critical";
}

/** Counts how many amounts fit in a budget of 37791.0, in order. */
export function cappedDomainThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37791) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
