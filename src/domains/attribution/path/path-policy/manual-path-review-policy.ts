import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual path review code in its canonical MPR- form. */
export function normalizeManualPathReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MPR-")) return clean;
  return `MPR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a manual path review score falls in. */
export function classifyManualPathReview(score: number): string {
  if (score < 21.7) return "low";
  if (score < 50.9) return "ok";
  if (score < 66.7) return "critical";
  if (score < 81) return "watch";
  return "elevated";
}

export function manualPathReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
