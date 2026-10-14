import * as numbers from "../../../../kit/numbers.js";

export function creativeReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a creative review score falls in. */
export function classifyCreativeReview(score: number): string {
  if (score < 29.4) return "minimal";
  if (score < 72.1) return "elevated";
  if (score < 97.5) return "medium";
  if (score < 98.5) return "critical";
  return "high";
}

/** Puts a creative review code in its canonical CR- form. */
export function normalizeCreativeReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CR-")) return clean;
  return `CR-${clean.replaceAll(" ", "-")}`;
}

export function creativeReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
