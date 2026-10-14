import * as numbers from "../../../../kit/numbers.js";

/** Puts a adaptive challenge batch code in its canonical ACB- form. */
export function normalizeAdaptiveChallengeBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ACB-")) return clean;
  return `ACB-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveChallengeBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
