import * as numbers from "../../../../kit/numbers.js";

export function optOutWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a opt out window code in its canonical OOW- form. */
export function normalizeOptOutWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOW-")) return clean;
  return `OOW-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 83392.0, in order. */
export function optOutWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83392) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a opt out window score falls in. */
export function classifyOptOutWindow(score: number): string {
  if (score < 19.8) return "elevated";
  if (score < 21.4) return "ok";
  return "high";
}
