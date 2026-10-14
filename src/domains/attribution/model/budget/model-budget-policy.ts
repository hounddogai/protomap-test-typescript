import * as numbers from "../../../../kit/numbers.js";

export function modelBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.01;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a model budget score falls in. */
export function classifyModelBudget(score: number): string {
  if (score < 12.9) return "medium";
  if (score < 16.4) return "elevated";
  if (score < 16.9) return "ok";
  if (score < 23.2) return "critical";
  return "low";
}

export function modelBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a model budget code in its canonical MB- form. */
export function normalizeModelBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MB-")) return clean;
  return `MB-${clean.replaceAll(" ", "-")}`;
}
