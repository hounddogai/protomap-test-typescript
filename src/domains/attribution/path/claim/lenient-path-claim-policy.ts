import * as numbers from "../../../../kit/numbers.js";

export function lenientPathClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.68;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a lenient path claim code in its canonical LPC- form. */
export function normalizeLenientPathClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPC-")) return clean;
  return `LPC-${clean.replaceAll(" ", "-")}`;
}
