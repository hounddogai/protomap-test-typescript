import * as numbers from "../../../../kit/numbers.js";

export function doubleOptInReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a double opt in review code in its canonical DOIR- form. */
export function normalizeDoubleOptInReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIR-")) return clean;
  return `DOIR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a double opt in review score falls in. */
export function classifyDoubleOptInReview(score: number): string {
  if (score < 35) return "ok";
  if (score < 36.6) return "high";
  if (score < 63.5) return "critical";
  return "elevated";
}
