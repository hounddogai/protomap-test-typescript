import * as numbers from "../../../../kit/numbers.js";

export function exitRuleOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.09;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a exit rule override code in its canonical ERO- form. */
export function normalizeExitRuleOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERO-")) return clean;
  return `ERO-${clean.replaceAll(" ", "-")}`;
}
