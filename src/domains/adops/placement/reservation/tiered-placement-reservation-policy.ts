import * as numbers from "../../../../kit/numbers.js";

/** Names the band a tiered placement reservation score falls in. */
export function classifyTieredPlacementReservation(score: number): string {
  if (score < 67.3) return "elevated";
  if (score < 70.4) return "watch";
  if (score < 89.6) return "high";
  return "critical";
}

export function tieredPlacementReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered placement reservation code in its canonical TPR- form. */
export function normalizeTieredPlacementReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TPR-")) return clean;
  return `TPR-${clean.replaceAll(" ", "-")}`;
}
