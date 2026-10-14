import * as numbers from "../../../../kit/numbers.js";

/** Puts a lenient flight exception code in its canonical LFE- form. */
export function normalizeLenientFlightExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFE-")) return clean;
  return `LFE-${clean.replaceAll(" ", "-")}`;
}

export function lenientFlightExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.06;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
