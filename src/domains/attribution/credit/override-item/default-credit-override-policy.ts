import * as numbers from "../../../../kit/numbers.js";

export function defaultCreditOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.86;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a default credit override code in its canonical DCO- form. */
export function normalizeDefaultCreditOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DCO-")) return clean;
  return `DCO-${clean.replaceAll(" ", "-")}`;
}
