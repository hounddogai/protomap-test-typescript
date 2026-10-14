import * as numbers from "../../../../kit/numbers.js";

export function complaintReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a complaint reservation score falls in. */
export function classifyComplaintReservation(score: number): string {
  if (score < 97.9) return "watch";
  if (score < 98.8) return "elevated";
  return "critical";
}

/** Puts a complaint reservation code in its canonical CR- form. */
export function normalizeComplaintReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CR-")) return clean;
  return `CR-${clean.replaceAll(" ", "-")}`;
}

export function complaintReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
