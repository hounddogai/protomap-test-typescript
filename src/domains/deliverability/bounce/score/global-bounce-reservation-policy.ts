import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global bounce reservation score falls in. */
export function classifyGlobalBounceReservation(score: number): string {
  if (score < 12.6) return "minimal";
  if (score < 73.6) return "medium";
  return "watch";
}

/** Puts a global bounce reservation code in its canonical GBR- form. */
export function normalizeGlobalBounceReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GBR-")) return clean;
  return `GBR-${clean.replaceAll(" ", "-")}`;
}

export function globalBounceReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function globalBounceReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.18;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
