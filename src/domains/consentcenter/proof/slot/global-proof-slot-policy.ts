import * as numbers from "../../../../kit/numbers.js";

export function globalProofSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function globalProofSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.94;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a global proof slot code in its canonical GPS- form. */
export function normalizeGlobalProofSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GPS-")) return clean;
  return `GPS-${clean.replaceAll(" ", "-")}`;
}
