import * as numbers from "../../../../kit/numbers.js";

export function globalPostReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a global post reservation code in its canonical GPR- form. */
export function normalizeGlobalPostReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GPR-")) return clean;
  return `GPR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a global post reservation score falls in. */
export function classifyGlobalPostReservation(score: number): string {
  if (score < 95.5) return "medium";
  if (score < 98.9) return "critical";
  return "ok";
}

export function globalPostReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.09;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
