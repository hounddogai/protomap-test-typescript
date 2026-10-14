import * as numbers from "../../../../kit/numbers.js";

export function cappedPostReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.5;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function cappedPostReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a capped post reservation score falls in. */
export function classifyCappedPostReservation(score: number): string {
  if (score < 15.9) return "elevated";
  if (score < 22.3) return "watch";
  if (score < 22.5) return "high";
  if (score < 87.5) return "low";
  return "minimal";
}

/** Puts a capped post reservation code in its canonical CPR- form. */
export function normalizeCappedPostReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CPR-")) return clean;
  return `CPR-${clean.replaceAll(" ", "-")}`;
}
