import * as numbers from "../../../../kit/numbers.js";

/** Names the band a escalation forecast score falls in. */
export function classifyEscalationForecast(score: number): string {
  if (score < 9.1) return "high";
  if (score < 56.3) return "low";
  if (score < 73.8) return "minimal";
  return "medium";
}

/** Puts a escalation forecast code in its canonical EF- form. */
export function normalizeEscalationForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("EF-")) return clean;
  return `EF-${clean.replaceAll(" ", "-")}`;
}

export function escalationForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 82946.0, in order. */
export function escalationForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82946) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
