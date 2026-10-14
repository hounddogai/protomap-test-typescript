import * as numbers from "../../../../kit/numbers.js";

export function fraudCheckWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a fraud check window code in its canonical FCW- form. */
export function normalizeFraudCheckWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCW-")) return clean;
  return `FCW-${clean.replaceAll(" ", "-")}`;
}
