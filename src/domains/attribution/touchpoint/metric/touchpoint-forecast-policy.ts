import * as numbers from "../../../../kit/numbers.js";

/** Puts a touchpoint forecast code in its canonical TF- form. */
export function normalizeTouchpointForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TF-")) return clean;
  return `TF-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 20941.0, in order. */
export function touchpointForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20941) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function touchpointForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.19;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
