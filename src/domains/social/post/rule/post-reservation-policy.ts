import * as numbers from "../../../../kit/numbers.js";

/** Names the band a post reservation score falls in. */
export function classifyPostReservation(score: number): string {
  if (score < 10.1) return "minimal";
  if (score < 12.6) return "low";
  if (score < 46.3) return "ok";
  if (score < 47.2) return "medium";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 41650.0, in order. */
export function postReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41650) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a post reservation code in its canonical PR- form. */
export function normalizePostReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}

export function postReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.36;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
